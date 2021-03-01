import EventEmitter from '@/utils/eventemitter';
import { APIWebSocket } from '@/net/websocket';
import { DownloadTask, DownloadTaskModel, DownloadTrackingVideo, DownloadWSAPI } from '@/models';
import { pull } from '@/utils/collection';

export class DownloadManager extends EventEmitter {
    socket?: APIWebSocket<DownloadWSAPI>;

    videos: DownloadTrackingVideo[] = [];

    tasks: DownloadTaskModel[] = [];

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
            case "added":
                this.emit('added', message.data);
                break;

            case "loaded":
                this.videos.forEach(video => video.finishTask(message.data));

                this.emit('loaded', message.data);
                break;

            case "tasks":
                this.updateTasks(message.data);

                this.videos.forEach(video => video.updateTask(this.tasks));

                this.emit('tasks', message.data);
                break;
        }
    }

    private updateTasks(tasks: DownloadTask[]) {
        for (const task of tasks) {
            const taskModel = this.tasks.find(t => t.id === task.id);

            if (taskModel) {
                taskModel.update(task);
            } else {
                this.tasks.push(new DownloadTaskModel(task));
            }
        }
    }

    async remove(id: string) {
        const task = this.tasks.find(task => task.id === id);

        if (!task) {
            throw new TypeError('Task not found.');
        }

        await task.remove();

        pull(this.tasks, task);
    }

    destroy() {
        this.removeAllListeners();
        this.socket?.close();
    }
}
