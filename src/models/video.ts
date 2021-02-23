import { CharacterModel } from './character';
import { addCharacterToVideo, createCharacter, deleteVideo } from '@/net/apis';

export interface VideoRecord {
    id: number;
    type: 'i';
    src_url: string;
    title: string;
    author_id: string;
    rating: number;

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

export interface VideoList {
    list: VideoModel[];
    total: number;
}

export interface VideoModel extends VideoRecord { }

export class VideoModel {
    /**
     * A handy method for chain calls.
     */
    static create(video: VideoRecord) {
        return new VideoModel(video);
    }

    deleting = false;

    // null to be reactive in Vue
    error: Nullable<string> = null;

    constructor(video: VideoRecord) {
        Object.assign(this, video);

        this.thumb = process.env.VUE_APP_STATIC_SERVER + "/test.jpg";
        this.rating = 5;
    }

    async addCharacter(char: CharacterModel) {
        await addCharacterToVideo(this.id, char.id);

        this.chars.push(char);
    }

    async addNewCharacter(name: string, alias?: string): Promise<CharacterModel> {
        // when alias is an empty string, an undefined should be passed
        // so it'll be stripped from the request body
        alias = alias || undefined;

        const char = await createCharacter(name, alias, this.id);

        this.chars.push(char);

        return char
    }

    async remove() {
        if (this.deleting) {
            return;
        }

        this.deleting = true;
        this.error = undefined;

        try {
            await deleteVideo(this.id);
        } catch (e) {
            this.error = e;
            throw e;
        } finally {
            this.deleting = false;
        }
    }
}
