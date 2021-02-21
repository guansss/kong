import { CharacterModel, VideoModel } from './models';
import { api } from './net';

export async function getVideos(
    params: {
        char?: string;
        offset?: number;
        limit?: number;
        order?: string;
    }
): Promise<{
    list: VideoModel[];
    total: number;
}> {
    return api('videos', 'GET', params);
}

export async function getVideo(id: string): Promise<VideoModel> {
    return api(`videos/${id}`, 'GET');
}

export async function retryDownload(id: string): Promise<void> {
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
