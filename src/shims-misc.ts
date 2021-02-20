declare module 'fuzzysearch' {
    export default function (needle: string, haystack: string): boolean;
}

declare module '*.svg' {
    const url: string;
    export default url;
}
