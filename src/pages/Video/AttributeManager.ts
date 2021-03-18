import { CharacterModel, TagModel, VideoModel } from '@/models';
import {
    addCharacterToVideo,
    addTagToVideo,
    createCharacter,
    createTag,
    getCharacters,
    getTags,
    removeCharacterFromVideo,
    removeTagFromVideo,
} from '@/net/apis';
import { pull } from '@/utils/collection';
import { assert } from '@/utils/misc';

export type VideoAttributeModels = CharacterModel | TagModel;
export type VideoAttributeTypes = 'char' | 'tag';
export type VideoAttribute<T extends VideoAttributeModels = VideoAttributeModels> = T & {
    label: string;
    color: string;
    removing?: boolean;
};

const COLOR_MAP = {
    char: 'green darken-3',
    tag: 'deep-orange darken-3',
};

/**
 * Returns a function that converts given model to a VideoAttribute.
 */
export function toAttribute(type: VideoAttributeTypes) {
    return <T extends VideoAttributeModels>(model: T): VideoAttribute<T> =>
        Object.assign(model, {
            color: COLOR_MAP[type],
            label: model.name + (model.alias ? ` (${model.alias})` : ''),
        });
}

export abstract class AttributeManager<T extends VideoAttributeModels = VideoAttributeModels> {
    abstract label: string;

    abstract type: VideoAttributeTypes;

    // should've used `${VideoAttributeTypes}s` but the compiler version is too low
    abstract attrKey: keyof VideoModel & ('chars' | 'tags');

    video: VideoModel;

    loading = false;

    initialization?: Promise<void>;

    // all available attributes of this type
    all: VideoAttribute<T>[] = [];

    selected: VideoAttribute<T>[] = [];

    // the attribute addition form
    add = {
        dialog: false,
        pending: false,
        candidates: [] as VideoAttribute<T>[],
        selected: null as Nullable<VideoAttribute<T>>,
        name: '',
        alias: '',
        error: '',
    };

    constructor(video: VideoModel) {
        this.video = video;
    }

    async init() {
        if (!this.initialization) {
            this.initialization = this._init();
        }

        return this.initialization;
    }

    async _init() {
        this.loading = true;

        this.all = (await this.getAll()).map(toAttribute(this.type));

        this.loading = false;
    }

    async updateCandidates() {
        await this.init();

        // filter out attributes of current video
        this.add.candidates = this.all.filter(
            (attr) => !this.video[this.attrKey].some((usedAttr) => attr.id === usedAttr.id),
        );
    }

    resetAdd() {
        this.add.selected = null;
        this.add.name = '';
        this.add.alias = '';
    }

    async submitAdd() {
        await this.init();

        assert(!this.add.pending);

        this.add.error = '';
        this.add.pending = true;

        try {
            let added: VideoAttribute<T>;

            if (this.add.selected) {
                added = this.add.selected;

                await this._addSelected();
            } else if (this.add.name) {
                const created = await this._addNew();

                added = toAttribute(this.type)(created);
            } else {
                throw new TypeError('Nothing to add.');
            }

            this.video[this.attrKey].push(added);

            this.all.push(added);

            this.resetAdd();
            await this.updateCandidates();
        } catch (e) {
            this.add.error = e + '';
        }

        this.add.pending = false;
    }

    async remove(attr: VideoAttribute<T>) {
        await this.init();

        assert(!attr.removing);

        attr.removing = true;

        try {
            await this._remove(attr);
        } catch (e) {
            console.warn(e);
        }

        attr.removing = false;
    }

    abstract getAll(): Promise<T[]>;

    abstract _addSelected(): Promise<void>;

    abstract _addNew(): Promise<T>;

    abstract _remove(attr: VideoAttribute<T>): Promise<void>;
}

export class CharacterAttributeManager extends AttributeManager<CharacterModel> {
    label = 'Character';
    type = 'char' as const;
    attrKey = 'chars' as const;

    async getAll() {
        return getCharacters();
    }

    async _addSelected() {
        await addCharacterToVideo(this.video.id, this.add.selected!.id);
    }

    async _addNew() {
        // when alias is an empty string, an undefined should be passed
        // so it'll be stripped from the request body
        const alias = this.add.alias || undefined;

        return createCharacter(this.add.name, alias, this.video.id);
    }

    async _remove(attr: VideoAttribute<CharacterModel>) {
        await removeCharacterFromVideo(this.video.id, attr.id);

        pull(this.video.chars, attr);
    }
}

export class TagAttributeManager extends AttributeManager<TagModel> {
    label = 'Tag';
    type = 'tag' as const;
    attrKey = 'tags' as const;

    async getAll() {
        return getTags();
    }

    async _addSelected() {
        await addTagToVideo(this.video.id, this.add.selected!.id);
    }

    async _addNew() {
        // when alias is an empty string, an undefined should be passed
        // so it'll be stripped from the request body
        const alias = this.add.alias || undefined;

        return createTag(this.add.name, alias, this.video.id);
    }

    async _remove(attr: VideoAttribute<TagModel>) {
        await removeTagFromVideo(this.video.id, attr.id);

        pull(this.video.tags, attr);
    }
}
