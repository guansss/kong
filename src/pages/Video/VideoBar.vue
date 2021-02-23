<template>
  <app-bar title="Video">
    <v-spacer></v-spacer>
    <v-btn
      icon
      @click="$root.$emit('reload')"
    >
      <v-icon>mdi-reload</v-icon>
    </v-btn>
    <v-btn
      icon
      @click="toggleEdit"
    >
      <v-icon>{{edit?'mdi-cog-off':'mdi-cog'}}</v-icon>
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
    title: "",
    edit: false,
  }),
  methods: {
    videoLoaded(video: VideoModel) {
      this.title = video.title;
    },
    toggleEdit() {
      this.edit = !this.edit;
      this.$root.$emit("Video:edit", this.edit);
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

<style lang="scss">
</style>
