import { pull } from '@/utils/collection';
import Plyr from 'plyr';
import plyrIcons from 'plyr/dist/plyr.svg';

const controls = ['play', 'fast-forward', 'progress', 'current-time', 'mute', 'volume', 'settings', 'pip', 'fullscreen'];

export function createPlayer(element: HTMLElement, fastForwardListener?: () => void) {
    const appliedControls = controls.slice();

    if (!fastForwardListener) {
        pull(appliedControls, 'fast-forward');
    }

    const player = new Plyr(element, {
        controls: appliedControls,
        iconUrl: plyrIcons,
        seekTime: 5,
        ratio: '16:9',
    });

    const onFullscreenChange = () => {
        setTimeout(() => {
            player.elements.container?.focus();
        }, 300);
    };

    player.on('enterfullscreen', onFullscreenChange);
    player.on('exitfullscreen', onFullscreenChange);

    if (fastForwardListener) {
        (player as any)._fastFowardButton = player.elements.buttons.fastForward;

        // the control buttons will be dynamically destroyed and created, so we observe its setter
        Object.defineProperty(player.elements.buttons, 'fastForward', {
            set(button: HTMLButtonElement) {
                button.addEventListener('click', e => {
                    e.stopImmediatePropagation();

                    fastForwardListener();
                });

                (player as any)._fastFowardButton = button;
            },
            get() {
                return (player as any)._fastFowardButton;
            },
        });
    }

    return player;
}
