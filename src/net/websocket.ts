import { API_SERVER, APIPrimitive, getSearchString } from './net';

const WS_SERVER = API_SERVER.replace('http', 'ws');

export interface WSAPI {
    url: string;
    params: Record<string, APIPrimitive>;
    send: string;
    receive: any;
}

export class APIWebSocket<T extends WSAPI = WSAPI> {
    static create<T extends WSAPI = WSAPI>(
        url: T extends WSAPI ? T['url'] : string,
        params?: T extends WSAPI ? T['params'] : Record<string, APIPrimitive>,
    ): Promise<APIWebSocket<T>> {
        return new Promise((resolve, reject) => {
            const ws = new APIWebSocket<T>(url, params);

            ws.socket.addEventListener('open', () => {
                resolve(ws);
            });

            ws.onError = e => reject(e);
        });
    }

    url: string;
    socket: WebSocket;

    alive = true;

    constructor(
        url: string,
        params?: T extends WSAPI ? T['params'] : Record<string, APIPrimitive>,
    ) {
        this.url = new URL(url, WS_SERVER).toString() + getSearchString(params);

        this.socket = new WebSocket(this.url);

        this.socket.addEventListener('message', (e: MessageEvent) => {
            this._onMessage(JSON.parse(e.data));
            this.onMessage(JSON.parse(e.data));
        });

        this.socket.addEventListener('error', () => {
            this.onError(new Error('Error occurred in WebSocket: ' + this.url));
        });
    }

    send(data: T['send']): boolean {
        if (this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(data);
            return true;
        }

        return false;
    }

    async* messages() {
        const closed = new Promise((resolve, reject) => {
            this.socket.addEventListener('close', (e: Event) => {
                reject(e);
            });
        });

        if (this.socket.readyState === WebSocket.CONNECTING) {
            await Promise.race([
                closed,
                new Promise<void>(resolve => {
                    this.socket.addEventListener('open', () => {
                        resolve();
                    });
                }),
            ]);
        }

        while (this.socket.readyState === WebSocket.OPEN) {
            const result = await Promise.race<T['receive']>([
                closed,
                new Promise<T['receive']>(resolve => {
                    this._onMessage = resolve;
                }),
            ]);

            yield result;
        }
    }

    private _onMessage(e: T['receive']) { }

    onMessage(e: T['receive']) { }

    onError(e: Error) { }

    close() {
        this.alive = false;
        this.socket.close();
    }
}
