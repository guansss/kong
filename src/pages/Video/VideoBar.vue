<template>
  <app-bar title="Video">
    <v-spacer></v-spacer>
    <v-btn
        icon
        v-if="video"
        :disabled="video.deleting||video.deleted"
        @click="deleteVideo"
    >
      <v-icon>{{ video.deleted ? 'mdi-delete-circle-outline' : 'mdi-delete' }}</v-icon>
    </v-btn>
    <v-btn
        icon
        title="Reload"
        @click="$root.$emit('reload')"
    >
      <v-icon>mdi-reload</v-icon>
    </v-btn>
    <v-btn
        icon
        title="Control Room"
        @click="addToControlRoom"
    >
      <v-icon>mdi-view-grid{{ addedToControlRoom ? '' : '-plus' }}</v-icon>
    </v-btn>
    <v-btn
        icon
        title="Update thumbnail"
        :disabled="!video || $store.state.thumbnailUpdating"
        @click="updateThumbnail"
    >
      <v-icon>mdi-image</v-icon>
    </v-btn>
    <v-btn
        icon
        :title="'Random: ' + diceRolled"
        @click="random"
    >
      <v-icon>mdi-dice-{{ diceRolled % 6 + 1 }}</v-icon>
    </v-btn>
    <v-btn
        icon
        title="Edit"
        @click="toggleEdit"
    >
      <v-icon>{{ edit ? 'mdi-cog-off' : 'mdi-cog' }}</v-icon>
    </v-btn>
  </app-bar>
</template>

<script lang="ts">
import AppBar from '@/components/AppBar.vue';
import { VideoModel } from '@/models';
import { ControlRoomMessageEvent } from '@/pages/ControlRoom/ControlRoom.vue';
import { delay } from '@/utils/misc';
import Vue from 'vue';
import store from './store';

export default Vue.extend({
    name: "VideoBar",
    components: { AppBar },
    store,
    data: () => ({
        video: null as Nullable<VideoModel>,
        edit: false,
        diceRolled: 0,
        addedToControlRoom: false,
    }),
    methods: {
        videoLoaded(video: VideoModel) {
            if (video.id !== this.video?.id) {
                this.addedToControlRoom = false;
            }

            this.video = video;
        },
        toggleEdit() {
            this.edit = !this.edit;
            this.$root.$emit("Video:edit", this.edit);
        },
        deleteVideo() {
            this.$root.$emit("Confirm:show", {
                title: "Delete Video",
                confirm: (confirmed: boolean) => {
                    if (confirmed) {
                        this.video?.remove().catch(console.warn);
                    }
                },
            });
        },
        random() {
            this.diceRolled++;
            this.$root.$emit('Video:random');
        },
        async updateThumbnail() {
            this.$root.$emit('Video:updateThumbnail');
        },
        async addToControlRoom() {
            if (this.video && !this.addedToControlRoom) {
                try {
                    this.addedToControlRoom = await Promise.race([
                        // set a timeout for the request
                        delay(100, false),
                        new Promise<true>((resolve, reject) => {
                            const broadcast = new BroadcastChannel('control-room');

                            broadcast.onmessage = (event: ControlRoomMessageEvent) => {
                                if (event.data.type === 'added') {
                                    resolve(true);
                                } else if (event.data.type === 'error') {
                                    reject(event.data.data);
                                }
                            };

                            const message: ControlRoomMessageEvent['data'] = {
                                type: 'add',
                                data: this.video!.id,
                            };
                            broadcast.postMessage(message);
                        }),
                    ]);

                    if (!this.addedToControlRoom) {
                        // not receiving any response means that the control room has not been opened,
                        // and thus a new tab should be opened
                        const { href } = this.$router.resolve({
                            name: 'control-room',
                            query: { tr: this.video.id + '' },
                        });

                        window.open(href, '_blank');
                    }
                } catch (e) {
                    console.warn(e);
                }
            }
        },
    },
    created() {
        this.$root.$on("Video:loaded", this.videoLoaded);
    },
    beforeDestroy() {
        this.$root.$off("Video:loaded", this.videoLoaded);
    },
});
</script>

<style lang="scss"></style>
