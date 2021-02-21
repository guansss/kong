<template>
  <v-container>
    <VideoFilters />

    <v-row class="mx-n5 mx-md-n1 mt-n1 mb-1">
      <v-col
        v-for="video in videos"
        :key="video.id"
        class="pa-2"
        cols="6"
        md="4"
      >
        <v-card
          class="item"
          :to="video.videoLoaded?{name:'video',params:{id:video.id}}:undefined"
          target="_blank"
        >
          <v-img
            :src="video.thumbLoaded?video.thumb:undefined"
            :aspect-ratio="16/9"
          >
            <div
              v-if="!video.videoLoaded"
              class="fill-height d-flex flex-column text-center justify-center"
            >
              <template v-if="video.videoTask">
                <div class="mb-1 display-1">{{~~(video.videoTask.loaded/video.videoTask.size*100)}}%</div>
                <div class="subtitle-1">
                  {{video.videoTask.loaded|size}} / {{video.videoTask.size|size}}<br>
                  ({{video.speed|size}} / s)
                </div>
              </template>
              <div
                v-if="video.error"
                class="subtitle-1"
              >{{video.error}}</div>
            </div>
          </v-img>
          <v-btn
            icon
            absolute
            v-if="video.error&&video.videoTask"
            class=" ma-2"
            style="top:0"
            @click="retry(video)"
          >
            <v-icon>mdi-reload</v-icon>
          </v-btn>
          <v-btn
            icon
            absolute
            :href="video.src_url"
            target="_blank"
            class="ma-2"
            style="top:0;right:0"
          >
            <v-icon>mdi-open-in-new</v-icon>
          </v-btn>
          <div
            class="pa-2"
            :title="video.title"
          >
            <div class="text-truncate">{{video.title}}</div>
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
              >{{char.name}}</router-link>
            </div>
            <pre v-else> </pre>

            <div class="mt-1 d-flex flex-wrap">
              <router-link
                class="author link mr-auto"
                :to="$query({author:video.author_id})"
              >{{video.author_id}}</router-link>
              <span>{{video.created|date}}</span>
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
import { getVideos, retryDownload } from "@/net/apis";
import { DownloadTask, DownloadWSAPI } from "@/net/models";
import { APIWebSocket } from "@/net/websocket";
import { VideoEntry } from "./VideoEntry";
import VideoFilters from "./VideoFilters.vue";

const PAGE_SIZE = 24;

export default Vue.extend({
  name: "VideoList",
  components: { VideoFilters },
  props: {},
  data: () => ({
    videos: [] as VideoEntry[],

    refreshing: false,

    total: 0,
    page: 1,
    pages: 0,

    char: undefined as string | undefined,

    downloadWS: undefined as APIWebSocket<DownloadWSAPI> | undefined,
    downloadTasks: [] as DownloadTask[],
  }),
  methods: {
    async refresh() {
      this.page = +this.$route.query.page || 1;
      this.char = (this.$route.query.char as string) || undefined;

      if (this.refreshing) {
        return;
      }

      this.refreshing = true;

      const result = await getVideos({
        offset: (+this.page - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
        order: "created",
        char: this.char,
      });

      this.total = result.total;
      this.pages = Math.ceil(this.total / PAGE_SIZE);

      this.videos = result.list.map((video) => new VideoEntry(video));

      this.refreshing = false;
    },
    async trackTasks() {
      try {
        const ws = await APIWebSocket.create<DownloadWSAPI>("download/", {
          interval: 500,
        });

        this.downloadWS = ws;

        for await (const message of ws.messages()) {
          switch (message.type) {
            case "added":
              this.refresh();
              break;

            case "loaded":
              this.finishTask(message.data);
              break;

            case "tasks":
              this.videos.forEach((video) => video.updateTask(message.data));
          }
        }
      } catch (e) {
        // warn if the error is not caused by manually closing the WebSocket
        if (this.downloadWS?.alive) {
          console.warn(e);
        }
      }
    },
    finishTask(id: string) {
      const matched = this.videos.some((video) => video.finishTask(id));

      // a rare case that the task doesn't belong to any of the current videos
      if (!matched) {
        this.refresh();
      }
    },
    async retry(video: VideoEntry) {
      try {
        await retryDownload(video.videoTask!.id);
      } catch (e) {
        console.warn(e + "");
      }
    },
  },
  created() {
    this.refresh();
    this.trackTasks();
  },
  beforeRouteUpdate(to, from, next) {
    next();
    this.refresh();
  },
  beforeDestroy() {
    this.downloadWS?.close();
  },
});
</script>

<style scoped lang="scss">
.item {
  transition: background-color 0.15s ease-out;

  &.theme--dark:hover {
    background-color: #333;
  }
}

// don't show a text selector on items rendered as <div> instead of <a>
div.item {
  cursor: default;
}

.author {
  color: inherit;

  &:hover {
    color: var(--v-info-base);
  }
}
</style>
