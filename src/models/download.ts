import { removeDownload, startDownload, stopDownload } from '@/net/apis';
import { WSAPI } from '@/net/websocket';
import { VideoModel } from './video';

const SPEED_FILTER_STRENGTH = 5;

export interface DownloadTask {
    id: string;
    name: string;
    state: DownloadTaskState;
    type: 'video' | 'image';
    loaded: number;
    size: number;
    error?: string;
}

export enum DownloadTaskState {
    INITIAL,
    LOADING,
    SUCCEEDED,
    FAILED,
    STOPPED,
}

export interface DownloadWSAPI extends WSAPI {
    url: 'download/',
    params: {
        interval?: number;
    },
    send: '';
    receive: {
        type: 'tasks',
        data: DownloadTask[];
    } | {
        type: 'added' | 'loaded',
        data: string; // the task's ID
    };
}

export interface DownloadTaskModel extends DownloadTask {}

export class DownloadTaskModel {
    progress = '0%';

    // bytes per second
    speed = 0;

    // last time the speed was updated
    speedUpdateTime = Date.now();

    get startable() {
        return this.state == DownloadTaskState.STOPPED || this.state === DownloadTaskState.FAILED;
    }

    constructor(task: DownloadTask) {
        Object.assign(this, task);

        // init the progress
        this.updateProgress(this.loaded);
    }

    update(task: DownloadTask) {
        const lastLoaded = this.loaded;
        const shouldUpdateProgress = this.state === DownloadTaskState.LOADING && !this.error;

        Object.assign(this, task);

        if (shouldUpdateProgress) {
            this.updateProgress(lastLoaded);
        }
    }

    private updateProgress(lastLoaded: number) {
        const now = Date.now();

        // avoid zero time
        const deltaTime = (now - this.speedUpdateTime) || 1;

        const instantaneousSpeed = (this.loaded - lastLoaded) / deltaTime * 1000;

        this.speed += (instantaneousSpeed - this.speed) / SPEED_FILTER_STRENGTH;
        this.speedUpdateTime = now;
        this.progress = ~~(this.loaded / this.size * 100) + '%';
    }

    async start() {
        if (!this.startable) {
            throw new Error('Invalid state: ' + DownloadTaskState[this.state]);
        }

        // remember to reset the status or the computed speed will get crazy for the first few seconds
        this.speedUpdateTime = Date.now();

        return startDownload(this.id);
    }

    async stop() {
        return stopDownload(this.id);
    }

    async remove() {
        return removeDownload(this.id);
    }
}

export interface DownloadTrackingVideo extends VideoModel {}

export class DownloadTrackingVideo {
    // null to be reactive in Vue
    videoTask: Nullable<DownloadTaskModel> = null;
    thumbTask: Nullable<DownloadTaskModel> = null;

    videoLoaded: boolean;
    thumbLoaded: boolean;

    constructor(video: VideoModel) {
        Object.assign(this, video);

        this.videoLoaded = !video.video_dl_id;
        this.thumbLoaded = !video.thumb_dl_id;
    }

    updateTask(tasks: DownloadTaskModel[]) {
        let videoTask: DownloadTaskModel | undefined;
        let thumbTask: DownloadTaskModel | undefined;

        for (const task of tasks) {
            if (task.id === this.video_dl_id) {
                videoTask = task;
            } else if (task.id === this.thumb_dl_id) {
                thumbTask = task;
            }
        }

        if (videoTask) {
            // only care about the error of video task
            this.error = videoTask.error;
        } else if (!this.videoTask && !this.videoLoaded) {
            this.error = "Not downloaded";
        }

        this.videoTask = videoTask;
        this.thumbTask = thumbTask;
    }

    finishTask(taskID: string): boolean {
        if (taskID === this.video_dl_id) {
            this.video_dl_id = null;
            this.videoTask = null;
            this.videoLoaded = true;

            return true;
        } else if (taskID === this.thumb_dl_id) {
            this.thumb_dl_id = null;
            this.thumbTask = null;
            this.thumbLoaded = true;

            return true;
        }

        return false;
    }

    async retryDownload() {
        this.error = undefined;

        try {
            let retried = false;

            if (this.videoTask?.startable) {
                retried = true;
                await this.videoTask.start();
            }

            if (this.thumbTask?.startable) {
                retried = true;
                await this.thumbTask.start();
            }

            if (!retried) {
                throw new TypeError('Could not retry any task.');
            }
        } catch (e) {
            console.warn(e, this.videoTask, this.thumbTask);
            this.error = e;
        }
    }
}
