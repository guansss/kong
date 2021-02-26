export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function assert(value: any, message?: string): asserts value {
    if (!value) {
        throw new AssertError(message);
    }
}

class AssertError extends Error { }
