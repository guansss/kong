import { API } from './net';
import { WSAPI } from './websocket';

export interface VideoModel {
    id: string;
    type: 'i';
    src_url: string;
    title: string;
    author_id: string;

    url: string;
    file: string;
    thumb: string;

    video_dl_url?: string;
    thumb_dl_url?: string;

    // ID of the download tasks
    video_dl_id?: string;
    thumb_dl_id?: string;

    created: DOMTimeStamp;
    uploaded: DOMTimeStamp;
}

export interface VideosAPI extends API {
    url: 'videos/',
    params: {
        offset?: number;
        limit?: number;
        order?: string;
    };
    result: {
        list: VideoModel[];
        total: number;
    };
}

export interface VideoAPI extends API {
    url: 'videos/',
    params: {
        ID: string;
    };
    result: VideoModel;
}

export interface DownloadTask {
    id: string;
    loaded: number;
    size: number;
    error?: string;
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

export interface DownloadRetryAPI extends API {
    url: 'download/retry/',
    params: {
        ID: string;
    };
    result: undefined;
}
