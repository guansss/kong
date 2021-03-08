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
import { getRandomVideo, getVideo } from '@/net/apis';
import { DownloadManager } from '@/tools/DownloadManager';
import Plyr from 'plyr';
import plyrIcons from 'plyr/dist/plyr.svg';
import Vue from 'vue';
import VideoInfo from './VideoInfo.vue';

export default Vue.extend({
    name: 'Video',
    components: { VideoInfo },
    data: () => ({
        video: null as Nullable<DownloadTrackingVideo>,

        player: undefined as Plyr | undefined,

        videoIDOverwriting: false,

        downloadManager: undefined as DownloadManager | undefined,
    }),
    watch: {
        'video.thumbLoaded': {
            immediate: true,
            handler(loaded: boolean) {
                if (loaded && !this.video!.videoLoaded) {
                    this.player!.poster = this.video!.thumb;
                }
            },
        },
        'video.videoLoaded': {
            immediate: true,
            handler(loaded: boolean) {
                if (loaded) {
                    this.player!.source = {
                        type: 'video',
                        sources: [{
                            src: this.video!.url,
                            type: 'video/mp4',
                        }],
                        poster: this.video!.thumb,
                    };
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

            this.$root.$emit('Video:loaded', this.video);
        },
        setUpPlayer() {
            this.player = new Plyr(this.$refs.player as HTMLElement, {
                iconUrl: plyrIcons,
                seekTime: 5,
            });
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
    async created() {
        this.$root.$on('Video:random', this.random);

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

        this.player?.destroy();
        this.downloadManager?.destroy();
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
