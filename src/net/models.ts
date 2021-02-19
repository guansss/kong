import { WSAPI } from './websocket';

export interface VideoModel {
    id: number;
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

    chars: CharacterModel[];
}

export interface CharacterModel {
    id: number;
    name: string;
    abbr: string;
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
