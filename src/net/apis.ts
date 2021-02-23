import { CharacterModel, VideoModel, VideoList, VideoRecord } from '@/models';
import { api } from './net';

export async function getVideos(
    params: {
        char?: string;
        offset?: number;
        limit?: number;
        order?: string;
    }
): Promise<VideoList> {
    // this is what the API actually returns
    type APIVideoList = Omit<VideoList, 'list'> & { list: VideoRecord[]; };

    const result = await api<APIVideoList>('videos', 'GET', params);

    result.list = result.list.map(VideoModel.create);

    return result as VideoList;
}

export async function getVideo(id: string | number): Promise<VideoModel> {
    return api<VideoRecord>(`videos/${id}`, 'GET').then(VideoModel.create);
}

export async function deleteVideo(id: string | number): Promise<void> {
    return api(`videos/${id}`, 'DELETE');
}

export async function retryDownload(id: string | number): Promise<void> {
    return api(`download/retry/${id}`, 'GET');
}

export async function getCharacters(): Promise<CharacterModel[]> {
    return api('chars', 'GET');
}

export async function createCharacter(name: string, alias: string | undefined, video_id?: number): Promise<CharacterModel> {
    return api('chars', 'POST', { name, alias, video_id });
}

export async function addCharacterToVideo(videoID: number, charID: number): Promise<void> {
    return api(`chars/${charID}/videos/${videoID}`, 'POST');
}

export async function removeCharacterFromVideo(videoID: number, charID: number): Promise<void> {
    return api(`chars/${charID}/videos/${videoID}`, 'DELETE');
}
