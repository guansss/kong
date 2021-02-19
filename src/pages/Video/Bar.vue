<template>
  <app-bar title="Video">
    <v-spacer></v-spacer>
    <v-btn
      icon
      @click="$root.$emit('reload')"
    >
      <v-icon>mdi-reload</v-icon>
    </v-btn>
  </app-bar>
</template>

<script lang="ts">
import Vue from "vue";
import AppBar from "@/components/AppBar.vue";
import { VideoModel } from "@/net/models";

export default Vue.extend({
  name: "Bar",
  components: { AppBar },
  data: () => ({
    title: "",
  }),
  methods: {
    videoLoaded(video: VideoModel) {
      this.title = video.title;
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
