import { Download, DownloadModel, DownloadTrackingVideo, DownloadWSAPI } from '@/models';
import { APIWebSocket } from '@/net/websocket';
import EventEmitter from '@/utils/eventemitter';

export class DownloadManager extends EventEmitter {
    socket?: APIWebSocket<DownloadWSAPI>;

    videos: DownloadTrackingVideo[] = [];

    downloads: DownloadModel[] = [];

    constructor() {
        super();

        this.setup().then();
    }

    private async setup() {
        try {
            this.socket = await APIWebSocket.create('download/', {
                interval: 500,
            });

            for await (const message of this.socket.messages()) {
                this.processMessage(message);
            }
        } catch (e) {
            // warn if the error is not caused by manually closing the WebSocket
            if (this.socket?.alive) {
                if (e instanceof ErrorEvent) {
                    console.warn('WebSocket closed unexpectedly.');
                } else {
                    console.warn(e);
                }
            }
        }
    }

    private processMessage(message: DownloadWSAPI['receive']) {
        switch (message.type) {
            case 'added':
                this.emit('added', message.data);
                break;

            case 'loaded':
                for (const id of message.data) {
                    for (const video of this.videos) {
                        video.finishDownload(id);
                    }
                }

                this.emit('loaded', message.data);
                break;

            case 'status':
                this.updateDownloads(message.data);

                this.videos.forEach(video => video.updateDownload(this.downloads));

                this.emit('status', message.data);
                break;
        }
    }

    private updateDownloads(downloads: Download[]) {
        for (const download of downloads) {
            const downloadModel = this.downloads.find(d => d.id === download.id);

            if (downloadModel) {
                downloadModel.update(download);
            } else {
                this.downloads.push(new DownloadModel(download));
            }
        }
    }

    destroy() {
        this.removeAllListeners();
        this.socket?.close();
    }
}
