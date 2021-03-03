export function delay<T>(ms: number, returnValue?: T): Promise<T> {
    return new Promise(resolve => setTimeout(() => resolve(returnValue), ms));
}

export function assert(value: any, message?: string): asserts value {
    if (!value) {
        throw new AssertError(message);
    }
}

class AssertError extends Error {}
