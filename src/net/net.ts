import { pickBy } from 'lodash';

export const API_SERVER = process.env.VUE_APP_API_SERVER;
export const STATIC_SERVER = process.env.VUE_APP_STATIC_SERVER;

export type APIPrimitive = string | number | boolean | undefined | null;

export function file(path: string): string {
    let url = new URL(path, STATIC_SERVER).toString();

    // manually escape some reserved characters in the file's path
    url = url.replace(/#/g, '%23').replace(/\?/g, '%3F');

    return url;
}

/**
 * Converts params object to a search string. An "ID" parameter will be
 * specially prepended to the search string.
 *
 * ```js
 * getSearchString({
 *     ID: 1,
 *     id: 2,
 *     foo: 'bar'
 * })
 * // returns "1?id=2&foo=bar"
 * ```
 */
export function getSearchString(params?: Record<string, APIPrimitive>): string {
    if (params) {
        const qualifiedParams = pickBy(params,
            (value, key) => value !== undefined,
        );

        // despite the type incompatibility, URLSearchParams can actually
        // receive `Record<string, Primitive>` as argument
        const search = new URLSearchParams(qualifiedParams as Record<string, string>).toString();

        return (params.ID || '') + (search ? '?' + search : '');
    }

    return '';
}

export async function api<T>(
    url: string,
    method: string,
    params?: Record<string, APIPrimitive>,
    paramType?: 'search' | 'body',
    resultType: 'json' | 'text' = 'json',
): Promise<T> {
    let fullURL = new URL(url, API_SERVER).toString();

    if (params) {
        if (!paramType) {
            paramType = method === 'GET' ? 'search' : 'body';
        }

        if (paramType === 'search') {
            fullURL += getSearchString(params);
        }
    }

    // empty properties will be stripped
    const headers = pickBy({
        'Accept': resultType === 'json' ? 'application/json' : 'text/plain',
        'Content-Type': paramType === 'body' ? 'application/json' : '',
    }, value => value);

    const res = await fetch(fullURL, {
        method,
        headers,
        body: paramType === 'body' ? JSON.stringify(params || {}) : undefined,
    });

    if (res.ok) {
        if (resultType === 'text') {
            return res.text() as any;
        }

        return res.json();
    } else {
        let message = '';

        try {
            const { detail } = await res.json();

            if (Array.isArray(detail)) {
                console.warn(detail);

                message = detail.map(item => item.msg).join('; ');
            } else {
                message = detail;
            }
        } catch (e) {
            console.warn('Could not parse API error.', e);
        }

        throw new NetworkError(message ?? '', fullURL, res.status);
    }
}

class NetworkError extends Error {
    constructor(message: string, public url: string, public status: number) {
        super(`NetworkError: ${message} (url=${url}, status=${status})`);
    }
}
