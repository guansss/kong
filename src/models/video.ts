import { deleteVideo, updateVideo } from '@/net/apis';
import { file } from '@/net/net';
import { CharacterModel } from './character';
import { PersonModel } from './person';
import { TagModel } from './tag';

export interface VideoRecord {
    id: number;
    type: 'i';
    src_url: string;
    title: string;
    rating: number;
    deleted: Nullable<boolean>;

    url: string;
    file: string;
    thumb: string;

    video_dl_url: string | null;
    thumb_dl_url: string | null;

    // ID of the download tasks
    video_dl_id: string | null;
    thumb_dl_id: string | null;

    created: DOMTimeStamp;
    uploaded: DOMTimeStamp;

    creator_id: string | null;
    creator: PersonModel | null;
    chars: CharacterModel[];
    tags: TagModel[];
}

export interface VideoList {
    list: VideoModel[];
    total: number;
}

export interface VideoModel extends VideoRecord {}

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

        if (!(video instanceof VideoModel)) {
            // the rating number in database is 0-10, while Vuetify's
            // rating component requires 0-5 for displaying five stars
            this.rating /= 2;

            this.url = file(this.url);
            this.thumb = file(this.thumb);
        }
    }

    /**
     * Sets rating in 0-5.
     */
    async setRating(rating: number) {
        await updateVideo(this.id, {
            // API receives an integer in 0-10
            rating: ~~(rating * 2),
        });

        this.rating = rating;
    }

    async remove() {
        if (this.deleting || this.deleted) {
            return;
        }

        this.deleting = true;
        this.error = undefined;

        try {
            await deleteVideo(this.id);

            this.deleted = true;
        } catch (e) {
            this.error = e;
            throw e;
        } finally {
            this.deleting = false;
        }
    }
}
