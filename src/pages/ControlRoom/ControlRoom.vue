<template>
  <!-- This is madness, this is MADNESS!!! -->
  <div class="room">
    <div
        v-for="(panel, i) in panels"
        :key="i"
        :class="'panel ' + panel.position"
    >
      <video
          playsinline
          controls
          ref="players"
          v-visible="!!panel.player"
      ></video>

      <v-fade-transition>
        <v-overlay
            absolute
            v-if="edit"
            color="black"
            opacity="0.3"
        >
          <TempVar
              :isTop="panel.position.charAt(0) === 't'"
              :isLeft="panel.position.charAt(1) === 'l'"
          >
            <div
                class="video-overlay"
                slot-scope="{ isTop, isLeft }"
            >
              <v-btn
                  :class="'arrow arrow-' + (isTop ? 'down' : 'up')"
                  @click="swapPanel(i, (isTop ? 'b' : 't') + panel.position.charAt(1))"
              >
                <v-icon v-if="isTop">mdi-chevron-down</v-icon>
                <v-icon v-else>mdi-chevron-up</v-icon>
              </v-btn>
              <v-btn
                  :class="'arrow arrow-' + (isLeft ? 'right' : 'left')"
                  @click="swapPanel(i, panel.position.charAt(0) + (isLeft ? 'r' : 'l'))"
              >
                <v-icon v-if="isLeft">mdi-chevron-right</v-icon>
                <v-icon v-else>mdi-chevron-left</v-icon>
              </v-btn>
              <v-btn
                  class="close"
                  @click="removePanel(i)"
              ><v-icon>mdi-close</v-icon></v-btn>
            </div>
          </TempVar>
        </v-overlay>
      </v-fade-transition>
    </div>
  </div>
</template>

<script lang="ts">
import { VideoModel } from '@/models';
import { getVideo } from '@/net/apis';
import { delay } from '@/utils/misc';
import { Dictionary, intersection, without } from 'lodash';
import Plyr from 'plyr';
import plyrIcons from 'plyr/dist/plyr.svg';
import Vue from 'vue';

export interface ControlRoomMessageEvent extends MessageEvent {
    data: {
        type: 'add';
        data: number;
    } | {
        type: 'added';
    } | {
        type: 'error';
        data: Error;
    },
}

const POSITIONS = ['tr', 'tl', 'bl', 'br'] as const;
const PRIMARY_POSITION = 'tr';
const NONE = 0;

export default Vue.extend({
    name: "ControlRoom",
    data: () => ({
        panels: POSITIONS.map(position => ({
            position,
            videoID: NONE,
            video: null as Nullable<VideoModel>,
            player: undefined as Plyr | undefined,
        })),

        edit: false,
        ready: false,

        broadcastChannel: undefined as BroadcastChannel | undefined,
    }),
    methods: {
        setEdit(edit: boolean) {
            this.edit = edit;
        },
        updateLayout() {
            // clone the query because we'll mutate it
            const query = Object.assign({}, this.$route.query) as Dictionary<string>;

            for (const pos of POSITIONS) {
                if (query[pos]) {
                    const panel = this.panels.find(panel => panel.videoID === +query[pos]);

                    if (panel) {
                        if (panel.position !== pos) {
                            const swapPanel = this.panels.find(p => p.position === pos)!;

                            //swap the positions
                            swapPanel.position = panel.position;
                            panel.position = pos;
                        }

                        // remove the matched position
                        delete query[pos];
                    }
                } else {
                    // ensure every position is defined
                    query[pos] = NONE + '';
                }
            }

            const notMatchedPositions = intersection(Object.keys(query), POSITIONS);

            for (const pos of notMatchedPositions) {
                const index = this.panels.findIndex(panel => panel.position === pos);

                if (index !== -1) {
                    this.updateVideo(index, +query[pos]);
                } else {
                    // this should not happen but just in case
                    console.warn('Unexpected position:', pos);
                }
            }
        },
        async updateVideo(index: number, id: number) {
            if (id !== this.panels[index].videoID) {
                // assign the ID even if it's NONE
                this.panels[index].videoID = id;

                if (id) {
                    this.panels[index].video = await getVideo(id);
                }

                this.updatePlayer(index);
            }
        },
        updatePlayer(index: number) {
            const panel = this.panels[index];
            const video = panel.video;
            let player = panel.player;

            if (video) {
                if (!player) {
                    player = new Plyr((this.$refs.players as HTMLElement[])[index], {
                        iconUrl: plyrIcons,
                        seekTime: 5,
                    });

                    player.on('play', () => {
                        if (this.ready && panel.position === PRIMARY_POSITION) {
                            // cancel the ready state and notify the app bar
                            this.ready = false;
                            this.$root.$emit('ControlRoom:isReady', false);

                            player!.fullscreen.enter();

                            // pause all the other players
                            without(this.panels, panel).forEach(p => p.player?.pause());
                        }
                    });

                    panel.player = player;
                }

                player.source = {
                    type: "video",
                    sources: [{
                        src: video.url,
                        type: "video/mp4",
                    }],
                    poster: video.thumb,
                };
            } else { // when the video at this position has been removed
                player?.pause();
            }
        },
        observe() {
            this.broadcastChannel = new BroadcastChannel('control-room');
            this.broadcastChannel.onmessage = (event: ControlRoomMessageEvent) => {
                if (event.data.type === 'add') {
                    try {
                        this.addVideo(event.data.data);

                        const message: ControlRoomMessageEvent['data'] = {
                            type: 'added',
                        };
                        this.broadcastChannel?.postMessage(message);
                    } catch (e) {
                        console.warn(e);

                        const message: ControlRoomMessageEvent['data'] = {
                            type: 'error',
                            data: e,
                        };
                        this.broadcastChannel?.postMessage(message);
                    }
                }
            };
        },
        swapPanel(index: number, toPosition: (typeof POSITIONS)[number]) {
            const panel = this.panels[index];
            const swapPanel = this.panels.find(p => p.position === toPosition);

            // if both IDs are NONE, the target location will be the same as current,
            // which will cause Vue router to complaint about it
            if (panel.videoID || swapPanel!.videoID) {
                this.$router.push(this.$query({
                    [panel.position]: swapPanel!.videoID || null,
                    [toPosition]: panel.videoID || null,
                }));
            }
        },
        removePanel(index: number) {
            this.$router.push(this.$query({
                [this.panels[index].position]: null,
            }));
        },
        addVideo(id: number) {
            if (this.panels.find(panel => panel.videoID === id)) {
                return;
            }

            for (const panel of this.panels) {
                // add this video to the first empty panel
                if (!panel.videoID) {
                    // append the ID to query
                    this.$router.push(this.$query({ [panel.position]: id }));

                    return;
                }
            }

            throw new TypeError('No available position.');
        },
        setReady(ready: boolean) {
            this.ready = ready;

            if (ready) {
                for (const panel of this.panels) {
                    if (panel.position === PRIMARY_POSITION) {
                        panel.player?.pause();
                    } else {
                        if (panel.player) {
                            panel.player.pause();
                        }
                    }
                }

                window.scrollTo(0, document.documentElement.scrollHeight);
            }
        },
    },
    created() {
        this.updateLayout();
        this.observe();

        this.$root.$on("ControlRoom:edit", this.setEdit);
        this.$root.$on("ControlRoom:ready", this.setReady);
        this.$root.$emit("drawer", false);
    },
    async mounted() {
        await delay(200);

        // scroll to bottom to hide the app bar
        window.scrollTo(0, document.documentElement.scrollHeight);
    },
    beforeRouteUpdate(from, to, next) {
        // wait for the URL to change
        next();

        this.updateLayout();
    },
    beforeDestroy() {
        this.$root.$off("ControlRoom:edit", this.setEdit);
        this.$root.$off("ControlRoom:ready", this.setReady);

        for (const panel of this.panels) {
            panel.player?.destroy();
        }

        this.broadcastChannel?.close();
    },
});
</script>

<style
    scoped
    lang="scss"
>
.room {
  height: 100vh;
}

.panel {
  position: absolute;
  width: 50%;
  height: 50%;
  display: flex;
  align-items: center;
  background: #000;

  &.tr {
    top: 0;
    right: 0;
  }

  &.tl {
    top: 0;
    left: 0;
  }

  &.br {
    bottom: 0;
    right: 0;
  }

  &.bl {
    bottom: 0;
    left: 0;
  }
}

::v-deep .plyr {
  width: 100%;
  height: 100%;
}

::v-deep .v-overlay__content {
  width: 100%;
  height: 100%;
}

.video-overlay {
  opacity: 0.7;

  .arrow,
  .close {
    position: absolute;
    width: 128px;
    height: 128px;
  }

  .arrow-up, .arrow-down {
    width: 128px;
    height: 64px;
    left: 50%;
    transform: translateX(-50%);
  }

  .arrow-left, .arrow-right {
    width: 64px;
    height: 128px;
    top: 50%;
    transform: translateY(-50%);
  }

  .arrow-up {
    top: 0;
  }

  .arrow-down {
    bottom: 0;
  }

  .arrow-left {
    left: 0;
  }

  .arrow-right {
    right: 0;
  }

  .close {
    top: 50%;
    left: 50%;
    transform: translateX(-50%) translateY(-50%);
  }
}
</style>
