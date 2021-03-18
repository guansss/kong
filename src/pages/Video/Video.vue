<template>
  <v-container class="pb-4">
    <div class="video">
      <video
          ref="player"
          playsinline
          controls
      ></video>

      <div
          v-if="!video || !video.videoLoaded"
          class="cover text-h5"
      >
        <template v-if="video">
          <template v-if="video.download">
            <div class="mb-1 text-h3">{{ video.download.progress }}</div>
            <div>
              {{ video.download.completedLength|size }} / {{ video.totalLength.size|size }}<br>
              ({{ video.download.downloadSpeed|size }}/s)
            </div>
          </template>

          <div
              v-if="video.error"
          >{{ video.error }}
          </div>
        </template>
      </div>
    </div>

    <VideoInfo
        v-if="video"
        :video="video"
    />
  </v-container>
</template>

<script lang="ts">
import { DownloadTrackingVideo, VideoModel } from '@/models';
import { getRandomVideo, getVideo, updateVideoThumbnail } from '@/net/apis';
import { DownloadManager } from '@/tools/DownloadManager';
import { createPlayer } from '@/tools/player';
import Plyr from 'plyr';
import Vue from 'vue';
import store from './store';
import VideoInfo from './VideoInfo.vue';

export default Vue.extend({
    name: 'Video',
    components: { VideoInfo },
    store,
    data: () => ({
        video: null as Nullable<DownloadTrackingVideo>,

        player: undefined as any as Plyr,

        videoIDOverwriting: false,

        // available after mounted
        downloadManager: undefined as DownloadManager | undefined,
    }),
    watch: {
        'video.thumbLoaded': {
            immediate: true,
            handler(loaded: boolean) {
                if (loaded && !this.video!.videoLoaded) {
                    this.updatePlayer(this.video!.thumb);
                }
            },
        },
        'video.videoLoaded': {
            immediate: true,
            handler(loaded: boolean) {
                if (loaded) {
                    this.updatePlayer(this.video!.thumb, this.video!.url);
                }
            },
        },
    },
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
            this.video = new DownloadTrackingVideo(video);

            // track download if the video has not been loaded
            if (!this.downloadManager && !this.video.videoLoaded) {
                this.downloadManager = new DownloadManager();
            }

            if (this.downloadManager) {
                this.downloadManager.videos = [this.video];
            }

            document.title = video.title;

            this.$store.state.currentTime = 0;

            this.$root.$emit('Video:loaded', this.video);

            if (this.video.videoLoaded) {
                this.updatePlayer(this.video.thumb, this.video.url);
            } else if (this.video.thumbLoaded) {
                this.updatePlayer(this.video.thumb);
            }
        },
        setUpPlayer() {
            this.player = createPlayer(
                this.$refs.player as HTMLElement,
                () => this.random(),
            );

            this.player.on('pause', () => {
                this.$store.state.currentTime = this.player.currentTime;
            });
        },
        updatePlayer(thumb: string, src?: string) {
            if (!src) {
                this.player.poster = thumb;
            } else {
                this.player.source = {
                    type: 'video',
                    sources: [{
                        src: src,
                        type: 'video/mp4',
                    }],
                };
            }
        },
        async random() {
            try {
                const rating = (this.$route.query.rating as string | null) || undefined;

                const video = await getRandomVideo(this.video!.id, rating);

                this.videoIDOverwriting = true;
                await this.$router.push({ name: 'video', params: { id: video.id + '' } }).catch(ignored => {});
                this.videoIDOverwriting = false;

                this.updateVideo(video);
                this.player.play();
            } catch (e) {
                console.warn(e);
            }
        },
        async updateThumbnail() {
            if (!this.video || this.$store.state.thumbnailUpdating) {
                return;
            }

            this.$store.state.thumbnailUpdating = true;

            await updateVideoThumbnail(this.video.id, this.player.currentTime);

            this.$store.state.thumbnailUpdating = false;
        },
    },
    async created() {
        this.$root.$on('Video:random', this.random);
        this.$root.$on('Video:updateThumbnail', this.updateThumbnail);

        await this.loadVideo();
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
        this.$root.$off('Video:random', this.random);
        this.$root.$off('Video:updateThumbnail', this.updateThumbnail);

        this.downloadManager?.destroy();

        // defer the destruction until the router-view transition has finished in order to prevent UI flickering
        setTimeout(() => this.player?.destroy(), 500);
    },
});
</script>

<style
    scoped
    lang="scss"
>
.video {
  position: relative;
}

.cover {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  background: rgba(0, 0, 0, .5);
}
</style>
