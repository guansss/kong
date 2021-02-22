import { VideoModel, DownloadTask } from '@/net/models';
import { deleteVideo } from '@/net/apis';

const SPEED_FILTER_STRENGTH = 5;

export interface VideoEntry extends VideoModel { }

export class VideoEntry {
    // default to nulls so they can be reactive in Vue
    videoTask: DownloadTask | null | undefined = null;
    thumbTask: DownloadTask | null | undefined = null;

    videoLoaded: boolean;
    thumbLoaded: boolean;

    // bytes per second
    speed = 0;

    // last time the speed is updated
    speedUpdateTime: DOMTimeStamp = 0;

    deleting = false;

    error?: string;

    constructor(video: VideoModel) {
        Object.assign(this, video);

        this.videoLoaded = !video.video_dl_id;
        this.thumbLoaded = !video.thumb_dl_id;

        this.thumb = process.env.VUE_APP_STATIC_SERVER + "/test.jpg";
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

        // only care about the video task's error
        if (videoTask) {
            if (!videoTask.error) {
                this.updateProgress(videoTask.loaded, this.videoTask?.loaded || 0);
            }

            this.error = videoTask.error;
        }

        if (!videoTask && !this.videoTask && !this.videoLoaded) {
            this.error = "Not downloaded";
        }

        if (videoTask && this.videoTask) {
            // use property assigning so Vue won't have to recreate
            // the reactive setters/getters for the new task object.
            // this should improve the performance
            Object.assign(this.videoTask, videoTask);
        } else {
            this.videoTask = videoTask;
        }

        if (thumbTask && this.thumbTask) {
            Object.assign(this.thumbTask, thumbTask);
        } else {
            this.thumbTask = thumbTask;
        }
    }

    finishTask(taskID: string): boolean {
        if (taskID === this.video_dl_id) {
            this.video_dl_id = undefined;
            this.videoTask = undefined;
            this.videoLoaded = true;

            return true;
        } else if (taskID === this.thumb_dl_id) {
            this.thumb_dl_id = undefined;
            this.thumbTask = undefined;
            this.thumbLoaded = true;

            return true;
        }

        return false;
    }

    updateProgress(loaded: number, lastLoaded: number) {
        if (this.videoTask) {
            const now = Date.now();

            if (!this.speedUpdateTime) {
                this.speedUpdateTime = now;
                return;
            }

            const instantaneousSpeed = (loaded - lastLoaded) / (now - this.speedUpdateTime) * 1000;

            this.speed += (instantaneousSpeed - this.speed) / SPEED_FILTER_STRENGTH;
            this.speedUpdateTime = now;
        }
    }

    async remove() {
        if (this.deleting) {
            return;
        }

        this.deleting = true;

        await deleteVideo(this.id).catch((e) => {
            this.error = e;
            throw e;
        });

        this.deleting = false;
    }
}
