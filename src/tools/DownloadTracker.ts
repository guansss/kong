import EventEmitter from '@/utils/eventemitter';
import { APIWebSocket } from '@/net/websocket';
import { DownloadTrackingVideo, DownloadWSAPI } from '@/models';

export class DownloadTracker extends EventEmitter {
    socket?: APIWebSocket<DownloadWSAPI>;

    videos: DownloadTrackingVideo[] = [];

    constructor() {
        super();

        this.setup().then();
    }

    private async setup() {
        try {
            this.socket = await APIWebSocket.create("download/", {
                interval: 500,
            });

            for await (const message of this.socket.messages()) {
                this.processMessage(message);
            }
        } catch (e) {
            // warn if the error is not caused by manually closing the WebSocket
            if (this.socket?.alive) {
                console.warn('WebSocket closed unexpectedly.');
            }
        }
    }

    processMessage(message: DownloadWSAPI['receive']) {
        switch (message.type) {
            case "added":
                this.emit('added', message.data);
                break;

            case "loaded":
                this.videos.forEach(video => video.finishTask(message.data));

                this.emit('loaded', message.data);
                break;

            case "tasks":
                this.videos.forEach(video => video.updateTask(message.data));

                this.emit('tasks', message.data);
                break;
        }
    }

    destroy() {
        this.removeAllListeners();
        this.socket?.close();
    }
}
