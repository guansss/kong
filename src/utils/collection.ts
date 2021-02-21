/**
 * Just like Lodash's `pull()`, but invokes `array.splice()` so Vue can recognize the change.
 */
export function pull<T>(arr: T[], item: T | undefined) {
    const index = arr.indexOf(item as T);

    if (index !== -1) {
        arr.splice(index, 1);
    }
}
