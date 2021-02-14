import { API } from './net';

export interface VideoModel {
    id: string;
    type: 'i';
    src_id: string;
    title: string;
    author_id: string;

    url?: string;
    thumb_url?: string;

    file: string;
    thumb_file: string;

    // ID of the download tasks
    video_dl_id?: string;
    thumb_dl_id?: string;

    created: DOMTimeStamp;
    uploaded: DOMTimeStamp;
}

export interface VideosAPI extends API {
    params: {
        offset?: number;
        limit?: number;
    };
    result: {
        list: VideoModel[];
        total: number;
    };
}
