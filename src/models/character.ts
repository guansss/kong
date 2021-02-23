export interface CharacterRecord {
    id: number;
    name: string;
    alias: string | null;
}

// just an alias
export type CharacterModel = CharacterRecord;
