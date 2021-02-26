import { CharacterModel, PersonModel, TagModel, VideoList, VideoModel, VideoRecord } from '@/models';
import { api } from './net';

export async function getVideos(
    params: {
        creator?: number | string;
        char?: number | string;
        tag?: number | string;
        offset?: number;
        limit?: number;
        order?: string;
    },
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

export async function updateVideo(
    id: string | number,
    props: Partial<Pick<VideoRecord, 'rating'>>,
): Promise<VideoRecord> {
    return api(`videos/${id}`, 'PATCH', props);
}

export async function retryDownload(id: string | number): Promise<void> {
    return api(`download/retry/${id}`, 'GET');
}

export async function getPeople(): Promise<PersonModel[]> {
    return api('people', 'GET');
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

export async function getTags(): Promise<TagModel[]> {
    return api('tags', 'GET');
}

export async function createTag(name: string, alias: string | undefined, video_id?: number): Promise<TagModel> {
    return api('tags', 'POST', { name, alias, video_id });
}

export async function addTagToVideo(videoID: number, tagsID: number): Promise<void> {
    return api(`tags/${tagsID}/videos/${videoID}`, 'POST');
}

export async function removeTagFromVideo(videoID: number, tagsID: number): Promise<void> {
    return api(`tags/${tagsID}/videos/${videoID}`, 'DELETE');
}
