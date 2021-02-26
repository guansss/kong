export interface PersonRecord {
    id: number;
    name: string;
    url: string | null;
}

// just an alias
export type PersonModel = PersonRecord;
