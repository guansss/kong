<template>
  <div class="pb-4 w100">
    <video
      ref="player"
      playsinline
      controls
    >
    </video>

    <VideoInfo
      v-if="video"
      :video="video"
    />
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { getVideo } from "@/net/apis";
import { VideoModel, CharacterModel } from "@/models";
import Plyr from "plyr";
import plyrIcons from "plyr/dist/plyr.svg";
import VideoInfo from "./VideoInfo.vue";

interface Character extends CharacterModel {
  color: string;
}

export default Vue.extend({
  name: "Video",
  components: { VideoInfo },
  props: {
    id: String,
  },
  data: () => ({
    video: null as VideoModel | undefined | null,

    player: undefined as Plyr | undefined,

    char: {
      allChars: [] as Character[],

      edit: false,

      add: {
        dialog: false,
        name: "",
        alias: "",
      },
    },
  }),
  methods: {
    async loadVideo() {
      try {
        const video = await getVideo(this.id);

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

        document.title = video.title;

        this.$root.$emit("Video:loaded", video);
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
