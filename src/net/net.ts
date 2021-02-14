import { pickBy } from 'lodash';

const API_SERVER = process.env.VUE_APP_API_SERVER;
const STATIC_SERVER = process.env.VUE_APP_STATIC_SERVER;

type JSONPrimitive = string | number | boolean | undefined;

export interface API {
    params: Record<string, JSONPrimitive>;
    result: any;
}

export function file(url: string): string {
    return new URL(url, STATIC_SERVER).toString();
}

export async function api<T = any>(
    url: string,
    params?: T extends API ? T['params'] : Record<string, JSONPrimitive>,
    type: 'json' | 'text' = 'json'
): Promise<T extends API ? T['result'] : T> {
    let qualifiedParams: Record<string, JSONPrimitive> | undefined;

    if (params) {
        qualifiedParams = pickBy(params, value => value !== undefined);
    }

    // despite the type incompatibility, URLSearchParams can actually
    // receive `Record<string, JSONPrimitive>` as argument
    const search = new URLSearchParams(qualifiedParams as Record<string, string>).toString();

    const fullURL = new URL(url, API_SERVER).toString() + (search ? '?' + search : '');

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
