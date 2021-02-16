export function insert(str: string, index: number, substr: string): string {
    return str.slice(0, index) + substr + str.slice(index);
}
