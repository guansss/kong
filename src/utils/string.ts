/**
 * Inserts a substring into given string.
 */
export function insert(str: string, index: number, substr: string): string {
    return str.slice(0, index) + substr + str.slice(index);
}

/**
 * Generates a CSS HSL color by given string.
 *
 * @see https://stackoverflow.com/a/21682946
 */
export function hslColor(str: string, s = '100%', l = '30%') {
    let hash = 0,
        i,
        chr;
    for (i = 0; i < str.length; i++) {
        chr = str.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        hash |= 0; // Convert to 32bit integer
    }

    return `hsl(${hash % 360},${s},${l})`;
}
