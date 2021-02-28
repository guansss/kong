import { retryDownload } from '@/net/apis';
import { WSAPI } from '@/net/websocket';
import { VideoModel } from './video';

const SPEED_FILTER_STRENGTH = 5;

export interface DownloadTask {
    id: string;
    state: DownloadTaskState;
    loaded: number;
    size: number;
    error?: string;
}

export const enum DownloadTaskState {
    INITIAL = 0,
    LOADING = 1,
    SUCCEEDED = 2,
    FAILED = 3,
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

    constructor(task: DownloadTask) {
        Object.assign(this, task);

        // init the progress
        this.updateProgress(this.loaded);
    }

    update(task: DownloadTask) {
        const lastLoaded = this.loaded;

        Object.assign(this, task);

        if (!this.error) {
            this.updateProgress(lastLoaded);
        }
    }

    updateProgress(lastLoaded: number) {
        const now = Date.now();

        // avoid zero time
        const deltaTime = (now - this.speedUpdateTime) || 1;

        const instantaneousSpeed = (this.loaded - lastLoaded) / deltaTime * 1000;

        this.speed += (instantaneousSpeed - this.speed) / SPEED_FILTER_STRENGTH;
        this.speedUpdateTime = now;
        this.progress = ~~(this.loaded / this.size * 100) + '%';
    }

    async retry() {
        if (this.state !== DownloadTaskState.FAILED) {
            throw new Error('Only a failed task can be retried.');
        }

        // remember to reset these values or the speed will be negative for the first few seconds
        this.speedUpdateTime = Date.now();
        this.loaded = 0;

        return retryDownload(this.id);
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

    updateTask(tasks: DownloadTask[]) {
        let videoTask: DownloadTask | undefined;
        let thumbTask: DownloadTask | undefined;

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

            if (this.videoTask) {
                this.videoTask.update(videoTask);
            } else {
                this.videoTask = new DownloadTaskModel(videoTask);
            }
        } else {
            if (!this.videoTask && !this.videoLoaded) {
                this.error = "Not downloaded";
            }

            this.videoTask = null;
        }

        if (thumbTask) {
            if (this.thumbTask) {
                this.thumbTask.update(thumbTask);
            } else {
                this.thumbTask = new DownloadTaskModel(thumbTask);
            }
        } else {
            this.thumbTask = null;
        }
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

            if (this.videoTask?.state === DownloadTaskState.FAILED) {
                retried = true;
                await this.videoTask.retry();
            }

            if (this.thumbTask?.state === DownloadTaskState.FAILED) {
                retried = true;
                await this.thumbTask.retry();
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
