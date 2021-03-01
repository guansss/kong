<template>
  <v-container class="pt-0">
    <VideoFilters/>

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
                :style="video.error&&'background:rgba(0,0,0,.5)'"
            >
              <template v-if="video.videoTask">
                <div class="mb-1 text-h4">{{ video.videoTask.progress }}</div>
                <div class="subtitle-1">
                  {{ video.videoTask.loaded|size }} / {{ video.videoTask.size|size }}<br>
                  ({{ video.videoTask.speed|size }}/s)
                </div>
              </template>
              <div
                  v-if="video.error"
                  class="subtitle-1"
              >{{ video.error }}
              </div>
              <!-- Use `@click.stop.prevent` to prevent triggering the underlying v-card, which will be rendered as an <a> tag -->
              <v-btn
                  icon
                  absolute
                  v-if="video.error&&video.videoTask"
                  style="top:0;left:0"
                  @click.stop.prevent="video.retryDownload()"
              >
                <v-icon>mdi-reload</v-icon>
              </v-btn>
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
                <!-- Use `@click.stop.prevent` for the same reason as above -->
                <template v-slot:activator="{ on, attrs }">
                  <v-btn
                      icon
                      absolute
                      style="top:0;right:0"
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
              >{{ char.name }}
              </router-link>
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
        @input="$router.push($query({page:$event}))"
    ></v-pagination>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { getVideos } from "@/net/apis";
import { DownloadTrackingVideo } from "@/models";
import VideoFilters from "./VideoFilters.vue";
import { Dictionary } from "lodash";
import { DownloadManager } from '@/tools/DownloadManager';

const PAGE_SIZE = 24;

export default Vue.extend({
    name: "VideoList",
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
                creator: query.creator || undefined,
                char: query.char || undefined,
                tag: query.tag || undefined,
                order: query.order || "created",
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
            this.$root.$emit("Confirm:show", {
                title: "Delete Video",
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
    opacity: 0;
    background-image: linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0) 40%);
    transition: opacity 0.1s ease-out;
  }

  &:hover:before {
    opacity: 1;
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
