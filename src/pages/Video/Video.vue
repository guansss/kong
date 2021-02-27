<template>
  <v-container class="pb-4">
    <video
        ref="player"
        playsinline
        controls
    ></video>

    <VideoInfo
        v-if="video"
        :video="video"
    />
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { getRandomVideo, getVideo } from "@/net/apis";
import { VideoModel } from "@/models";
import Plyr from "plyr";
import plyrIcons from "plyr/dist/plyr.svg";
import VideoInfo from "./VideoInfo.vue";

export default Vue.extend({
    name: "Video",
    components: { VideoInfo },
    data: () => ({
        video: null as VideoModel | undefined | null,

        player: undefined as Plyr | undefined,

        videoIDOverwriting: false,
    }),
    methods: {
        async loadVideo() {
            try {
                const id = this.$route.params.id;

                this.updateVideo(await getVideo(id));
            } catch (e) {
                console.warn(e);
            }
        },
        updateVideo(video: VideoModel) {
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
        },
        setUpPlayer() {
            this.player = new Plyr(this.$refs.player as HTMLElement, {
                iconUrl: plyrIcons,
                seekTime: 5,
            });

            (window as any).player = this.player;
        },
        async random() {
            try {
                const rating = (this.$route.query.rating as string | null) || undefined;

                const video = await getRandomVideo(this.video!.id, rating);

                this.videoIDOverwriting = true;
                await this.$router.push({ name: 'video', params: { id: video.id + '' } }).catch(ignored => {});
                this.videoIDOverwriting = false;

                this.updateVideo(video);
            } catch (e) {
                console.warn(e);
            }
        },
    },
    created() {
        this.loadVideo();
        this.$root.$on("Video:random", this.random);
    },
    mounted() {
        this.setUpPlayer();
    },
    beforeRouteUpdate(from, to, next) {
        next();

        if (!this.videoIDOverwriting) {
            this.loadVideo();
        }
    },
    beforeDestroy() {
        this.$root.$off("Video:random", this.random);
    },
});
</script>

<style lang="scss">
@import "plyr";

.plyr__control--overlaid {
  top: unset;
  left: 40px;
  bottom: 32px;
}
</style>
