<template>
  <div class="pb-4 w100">
    <video
      ref="player"
      playsinline
      controls
    >
    </video>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { api } from "@/net/net";
import { VideoModel, VideoAPI } from "@/net/models";
import Plyr from "plyr";
import plyrIcons from "plyr/dist/plyr.svg";

export default Vue.extend({
  name: "Video",
  components: {},
  props: {
    id: String,
  },
  data: () => ({
    video: null as VideoModel | undefined | null,

    player: undefined as Plyr | undefined,
  }),
  methods: {
    async loadVideo() {
      try {
        const video = await api<VideoAPI>("videos/", { ID: this.id });
        this.video = video;

        this.player!.source = {
          type: "video",
          title: video.title,
          sources: [
            {
              src: video.url,
              type: "video/mp4",
            },
          ],
          poster: video.thumb,
        };
      } catch (e) {
        console.warn(e);
      }
    },
    setUpPlayer() {
      this.player = new Plyr(this.$refs.player as HTMLElement, {
        iconUrl: plyrIcons,
        seekTime: 5,
      });

      (window as any).player = this.player;
    },
  },
  created() {
    this.loadVideo();
  },
  mounted() {
    this.setUpPlayer();
  },
  beforeDestroy() {},
});
</script>

<style lang="scss">
@import "plyr";
</style>
