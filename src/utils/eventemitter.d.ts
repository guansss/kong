import BaseEventEmitter from 'eventemitter3';

export default class EventEmitter extends BaseEventEmitter {
    /**
     * Posts a sticky event, acts like the ones from EventBus but accepts a function, so the listener can only have at most one argument.
     *
     * @see http://greenrobot.org/eventbus/documentation/configuration/sticky-events/
     */
    sticky(event: string, ...args: any[]): this;
}
