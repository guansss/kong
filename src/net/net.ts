import { pickBy } from 'lodash';

export const API_SERVER = process.env.VUE_APP_API_SERVER;
export const STATIC_SERVER = process.env.VUE_APP_STATIC_SERVER;

export type APIPrimitive = string | number | boolean | undefined;

export function file(url: string): string {
    return new URL(url, STATIC_SERVER).toString();
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
            (value, key) => value !== undefined && key !== 'ID'
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
    resultType: 'json' | 'text' = 'json'
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
        'Content-Type': paramType === 'body' ? 'application/json' : ''
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
            const apiError = await res.json();

            message = apiError.detail || '';
        } catch (e) {
            console.warn('Could not parse API error.', e);
        }

        throw new NetworkError(message, fullURL, res.status);
    }
}

class NetworkError extends Error {
    constructor(message: string, public url: string, public status: number) {
        super(message);
    }

    toString() {
        return `NetworkError: ${this.message} (url=${this.url}, status=${this.status})`;
    }
}
