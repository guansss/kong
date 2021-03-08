import { WSAPI } from '@/net/websocket';
import { VideoModel } from './video';

// see https://aria2.github.io/manual/en/html/aria2c.html#aria2.tellStatus
export enum DownloadStatus {
    ACTIVE = 'active',
    WAITING = 'waiting',
    PAUSED = 'paused',
    ERROR = 'error',
    COMPLETE = 'complete',
    REMOVED = 'removed',
}

// the details of an Aria download
export interface Download {
    id: string;
    status: DownloadStatus;
    totalLength: number; // bytes
    completedLength: number; // bytes
    downloadSpeed: number; // bytes/sec
    errorMessage: string;
}

export interface DownloadWSAPI extends WSAPI {
    url: 'download/',
    params: {},
    send: '';
    receive: {
        type: 'status',
        data: Download[];
    } | {
        type: 'added' | 'loaded',
        data: string[]; // the download IDs
    };
}

export interface DownloadModel extends Download {}

export class DownloadModel {
    progress = '0%';

    constructor(download: Download) {
        Object.assign(this, download);

        // init the progress
        this.updateProgress();
    }

    update(task: Download) {
        Object.assign(this, task);
    }

    private updateProgress() {
        this.progress = ~~(this.completedLength / this.totalLength * 100) + '%';
    }
}

export class DownloadTrackingVideo extends VideoModel {
    // null to be reactive in Vue
    download: Nullable<DownloadModel> = null;

    videoLoaded: boolean;
    thumbLoaded: boolean;

    constructor(video: VideoModel) {
        super(video);

        this.videoLoaded = !video.video_dl_url;
        this.thumbLoaded = !video.thumb_dl_url;
    }

    addDownload(download: DownloadModel) {
        this.download = download;
    }

    updateDownload(downloads: DownloadModel[]) {
        if (!this.video_dl_id) {
            return;
        }

        const download = downloads.find(download => download.id === this.video_dl_id);

        if (download) {
            // only care about the error of video task
            this.error = download.errorMessage;
        } else if (!this.download && !this.videoLoaded) {
            this.error = 'Not downloaded';
        }

        this.download = download;
    }

    finishDownload(downloadID: string): boolean {
        if (downloadID === this.video_dl_id) {
            this.video_dl_url = null;
            this.video_dl_id = null;
            this.download = null;
            this.error = null;
            this.videoLoaded = true;

            return true;
        } else if (downloadID === this.thumb_dl_id) {
            this.thumb_dl_url = null;
            this.thumb_dl_id = null;
            this.thumbLoaded = true;

            return true;
        }

        return false;
    }
}
