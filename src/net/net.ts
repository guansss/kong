import { pickBy } from 'lodash';

export const API_SERVER = process.env.VUE_APP_API_SERVER;
export const STATIC_SERVER = process.env.VUE_APP_STATIC_SERVER;

export type APIPrimitive = string | number | boolean | undefined;

export interface API {
    url: string;
    params: Record<string, APIPrimitive>;
    result: any;
}

export function file(url: string): string {
    return new URL(url, STATIC_SERVER).toString();
}

export function getSearchString(params?: Record<string, APIPrimitive>): string {
    if (params) {
        const qualifiedParams = pickBy(params, value => value !== undefined);

        // despite the type incompatibility, URLSearchParams can actually
        // receive `Record<string, Primitive>` as argument
        const search = new URLSearchParams(qualifiedParams as Record<string, string>).toString();

        return '?' + search;
    }

    return '';
}

export async function api<T = any>(
    url: T extends API ? T['url'] : string,
    params?: T extends API ? T['params'] : Record<string, APIPrimitive>,
    type: 'json' | 'text' = 'json'
): Promise<T extends API ? T['result'] : T> {

    const fullURL = new URL(url, API_SERVER).toString() + getSearchString(params);

    const res = await fetch(fullURL);

    if (res.ok) {
        if (type === 'text') {
            return res.text() as any;
        }

        return res.json();
    } else {
        throw new NetworkError('', fullURL, res.status);
    }
}

class NetworkError extends Error {
    constructor(message: string, public url: string, public status: number) {
        super(message);
    }

    toString() {
        return `${super.toString()} (url=${this.url}, status=${this.status})`;
    }
}
