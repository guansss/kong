export interface TagRecord {
    id: number;
    name: string;
    alias: string | null;
}

// just an alias
export type TagModel = TagRecord;
