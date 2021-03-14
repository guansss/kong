import { CharacterModel, PersonModel, TagModel } from '@/models';
import { getCharacters, getPeople, getTags } from '@/net/apis';
import { Dictionary } from 'lodash';

export type VideoFilterModels = PersonModel | CharacterModel | TagModel;
export type VideoFilterTypes = 'creator' | 'char' | 'tag';
export type VideoFilter<T extends VideoFilterModels = VideoFilterModels> = T & {
    type: VideoFilterTypes;
    label: string;
    color: string;
};

const COLOR_MAP = {
    creator: 'primary darken-3',
    char: 'green darken-3',
    tag: 'deep-orange darken-3',
};

/**
 * Returns a function that converts given model to a VideoFilter.
 */
export function toFilter(type: VideoFilterTypes) {
    return <T extends VideoFilterModels>(model: T): VideoFilter<T> =>
        Object.assign(model, {
            type: type,
            color: COLOR_MAP[type],
            label: model.name + ((model as any).alias ? ` (${(model as any).alias})` : ''),
        });
}

export abstract class FilterManager<T extends VideoFilterModels> {
    abstract label: string;
    abstract type: VideoFilterTypes;

    loading = false;

    initialization?: Promise<void>;

    // all available characters
    all: VideoFilter<T>[] = [];

    abstract multiple: boolean;
    abstract selected: VideoFilter<T>[] | Nullable<VideoFilter<T>>;

    async init() {
        if (!this.initialization) {
            this.initialization = this._init();
        }

        return this.initialization;
    }

    async _init() {
        this.loading = true;

        this.all = (await this.getAll()).map(toFilter(this.type));

        this.loading = false;
    }

    async parseQuery(query: Dictionary<string>) {
        if (query[this.type]) {
            await this.init();

            const ids = query[this.type].split(',');
            const isInQuery = (filter: VideoFilter<T>) => ids.includes(filter.id + '');

            if (this.multiple) {
                this.selected = this.all.filter(isInQuery);
            } else {
                this.selected = this.all.find(isInQuery) || null;
            }
        } else {
            this.selected = this.multiple ? [] : null;
        }
    }

    toQuery(): string {
        if (Array.isArray(this.selected)) {
            return this.selected.map((char) => char.id).join(',');
        }

        return String(this.selected?.id ?? '');
    }

    abstract getAll(): Promise<T[]>;
}

export class CreatorFilterManager extends FilterManager<PersonModel> {
    label = 'Creator';
    type = 'creator' as const;

    multiple = false;
    selected: Nullable<VideoFilter<PersonModel>> = null;

    async getAll() {
        return getPeople();
    }
}

export class CharacterFilterManager extends FilterManager<CharacterModel> {
    label = 'Character';
    type = 'char' as const;

    multiple = true;
    selected: VideoFilter<CharacterModel>[] = [];

    async getAll() {
        return getCharacters();
    }
}

export class TagFilterManager extends FilterManager<TagModel> {
    label = 'Tag';
    type = 'tag' as const;

    multiple = true;
    selected: VideoFilter<TagModel>[] = [];

    async getAll() {
        return getTags();
    }
}
