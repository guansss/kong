import { loadValue, saveValue } from '@/utils/storage';

let sessionUpdateTimer = 0;

export function sessionExpired() {
    const lastTime = loadValue('session', 0);

    return Date.now() - lastTime > 10 * 60 * 1000;
}

export function startSession() {
    if (!sessionUpdateTimer) {
        const updater = () => saveValue('session', Date.now());

        updater();

        sessionUpdateTimer = setInterval(updater, 10 * 1000);
    }
}

export function destroySession() {
    clearInterval(sessionUpdateTimer);
}
