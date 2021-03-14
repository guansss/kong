<template>
  <v-container class="pt-0">
    <VideoFilters />

    <v-pagination
        v-if="total"
        :value="page"
        :length="pages"
        total-visible="10"
        @input="$router.push($query({page:$event}))"
    ></v-pagination>
    <v-row class="mx-n5 mx-md-n1 mt-0 mb-1">
      <v-col
          v-for="video in videos"
          :key="video.id"
          class="pa-2"
          cols="6"
          md="4"
          lg="3"
      >
        <v-card
            class="item"
            :to="{ name: 'video', params: { id: video.id } }"
        >
          <v-img
              :src="video.thumbLoaded ? video.thumb : undefined"
              :aspect-ratio="16/9"
          >
            <div
                class="cover fill-height d-flex flex-column justify-center text-center"
                :style="video.videoLoaded||'background:rgba(0,0,0,.5)'"
            >
              <template v-if="video.download">
                <div class="mb-1 text-h4">{{ video.download.progress }}</div>
                <div class="subtitle-1">
                  {{ video.download.completedLength|size }} / {{ video.download.totalLength|size }}<br>
                  ({{ video.download.downloadSpeed|size }}/s)
                </div>
              </template>
              <div
                  v-if="video.error"
                  class="subtitle-1"
              >{{ video.error }}
              </div>
              <div
                  v-else
                  class="rating pa-1"
              >
                <v-icon
                    v-for="i in ~~video.rating"
                    :key="i"
                    color="yellow"
                >mdi-star</v-icon>
                <v-icon
                    v-if="video.rating%1===0.5"
                    color="yellow"
                >mdi-star-half-full</v-icon>
              </div>
              <v-menu
                  bottom
                  left
              >
                <template v-slot:activator="{ on, attrs }">
                  <!-- Use `@click.stop.prevent` to prevent triggering the underlying v-card, which will be rendered as an <a> tag -->
                  <v-btn
                      icon
                      large
                      absolute
                      class="video-menu"
                      v-bind="attrs"
                      v-on="on"
                      @click.stop.prevent
                  >
                    <v-icon>mdi-dots-vertical</v-icon>
                  </v-btn>
                </template>
                <v-list>
                  <v-list-item
                      :href="video.src_url"
                      target="_blank"
                  >
                    <v-list-item-title>Open Source</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="remove(video)">
                    <v-list-item-title class="error--text text--lighten-1">Delete</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </div>
          </v-img>
          <div
              class="pa-2"
              :title="video.title"
          >
            <div class="text-truncate">{{ video.title }}</div>
          </div>
          <v-card-subtitle class="px-2 pt-0 pb-2">
            <div
                v-if="video.chars.length"
                class="d-flex flex-wrap"
            >
              <router-link
                  v-for="char in video.chars"
                  :key="char.id"
                  class="link mr-2 pink--text text--lighten-2"
                  :to="{query:{char:char.id+''}}"
              >{{ char.name }}</router-link>
            </div>
            <!-- a whitespace to hold the place when the video has no characters -->
            <pre v-else> </pre>

            <div class="mt-1 d-flex flex-wrap">
              <router-link
                  v-if="video.creator"
                  class="creator link mr-auto"
                  :to="$query({ creator: video.creator.id })"
              >{{ video.creator.name }}</router-link>
              <v-spacer v-else></v-spacer>
              <span>{{ video.created|date }}</span>
            </div>
          </v-card-subtitle>
        </v-card>
      </v-col>
    </v-row>
    <v-pagination
        v-if="total"
        :value="page"
        :length="pages"
        total-visible="10"
        @input="$router.push($query({page:$event}))"
    ></v-pagination>
  </v-container>
</template>

<script lang="ts">
import { DownloadTrackingVideo } from '@/models';
import { getVideos } from '@/net/apis';
import { DownloadManager } from '@/tools/DownloadManager';
import { Dictionary } from 'lodash';
import Vue from 'vue';
import VideoFilters from './VideoFilters.vue';

const PAGE_SIZE = 24;

export default Vue.extend({
    name: 'VideoList',
    components: { VideoFilters },
    props: {},
    data: () => ({
        videos: [] as DownloadTrackingVideo[],

        refreshing: false,

        total: 0,
        page: 1,
        pages: 0,

        downloadManager: new DownloadManager(),
    }),
    methods: {
        async refresh() {
            if (this.refreshing) {
                return;
            }

            this.refreshing = true;

            const query = this.$route.query as Dictionary<string>;

            this.page = +query.page || 1;

            const result = await getVideos({
                search: query.search || undefined,
                creator: query.creator || undefined,
                char: query.char || undefined,
                tag: query.tag || undefined,
                order: query.order || 'created',
                offset: (this.page - 1) * PAGE_SIZE,
                limit: PAGE_SIZE,
            });

            this.total = result.total;
            this.pages = Math.ceil(this.total / PAGE_SIZE);

            this.videos = result.list.map(
                video => new DownloadTrackingVideo(video),
            );

            this.downloadManager.videos = this.videos;

            this.refreshing = false;
        },
        async trackDownload() {
            this.downloadManager.on('added', this.refresh);
        },
        async remove(video: DownloadTrackingVideo) {
            this.$root.$emit('Confirm:show', {
                title: 'Delete Video',
                content: video.title,
                confirm: (confirmed: boolean) => {
                    if (confirmed) {
                        video.remove().then(this.refresh).catch(console.warn);
                    }
                },
            });
        },
    },
    created() {
        this.refresh();
        this.trackDownload();
    },
    beforeRouteUpdate(to, from, next) {
        next();
        this.refresh();
    },
    beforeDestroy() {
        this.downloadManager.destroy();
    },
});
</script>

<style
    scoped
    lang="scss"
>
.item {
  transition: background-color 0.1s ease-out;

  &.theme--dark:hover {
    background-color: #333;
  }

  &:hover .cover:before {
    background-color: rgba(0, 0, 0, .3);
  }
}

// don't show a text selector on items rendered as <div> instead of <a>
div.item {
  cursor: default;
}

.cover {
  &:before {
    content: "";
    position: absolute;
    width: 100%;
    height: 100%;
    transition: background-color 0.1s ease-out;
  }
}

.video-menu {
  top: 0;
  right: 0;

  &:hover::before {
    opacity: 0.3;
  }
}

.rating {
  position: absolute;
  top: 0;
  left: 0;
  text-shadow: 0 0 2px black, 0 0 2px black;
}

.creator {
  color: inherit;

  &:hover {
    color: var(--v-info-base);
  }
}
</style>
