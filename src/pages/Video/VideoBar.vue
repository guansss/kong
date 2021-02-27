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
        @click="$root.$emit('reload')"
    >
      <v-icon>mdi-reload</v-icon>
    </v-btn>
    <v-btn
        icon
        :title="diceRolled"
        @click="random"
    >
      <v-icon>mdi-dice-{{ diceRolled % 6 + 1 }}</v-icon>
    </v-btn>
    <v-btn
        icon
        @click="toggleEdit"
    >
      <v-icon>{{ edit ? 'mdi-cog-off' : 'mdi-cog' }}</v-icon>
    </v-btn>
  </app-bar>
</template>

<script lang="ts">
import Vue from "vue";
import AppBar from "@/components/AppBar.vue";
import { VideoModel } from "@/models";

export default Vue.extend({
    name: "VideoBar",
    components: { AppBar },
    data: () => ({
        video: null as Nullable<VideoModel>,
        edit: false,
        diceRolled: 0,
    }),
    methods: {
        videoLoaded(video: VideoModel) {
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
