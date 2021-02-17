<template>
  <div class="pb-4 w100">
    <v-row class="px-1 px-md-5 py-5">
      <v-col
        v-for="video in videos"
        :key="video.id"
        class="pa-2"
        cols="6"
        md="4"
      >
        <v-card
          class="item"
          :to="video.videoLoaded?'/videos/'+video.id:undefined"
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
          <v-card-title>{{video.title}}</v-card-title>
          <v-card-subtitle class="d-flex flex-wrap">
            <a
              class="author link mr-auto text-decoration-none"
              href="#author"
            >{{video.author_id}}</a>
            <span>{{video.created|date}}</span>
          </v-card-subtitle>
        </v-card>
      </v-col>
    </v-row>
    <v-pagination
      v-if="total"
      v-model="page"
      :length="pages"
    ></v-pagination>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { api } from "@/net/net";
import {
  DownloadTask,
  DownloadWSAPI,
  DownloadRetryAPI,
  VideosAPI,
} from "@/net/models";
import { APIWebSocket } from "@/net/websocket";
import { VideoEntry } from "./VideoEntry";

const PAGE_SIZE = 24;

export default Vue.extend({
  name: "VideoList",
  components: {},
  data: () => ({
    videos: [] as VideoEntry[],

    refreshing: false,

    total: 0,
    page: 1,
    pages: 0,

    downloadWS: undefined as APIWebSocket<DownloadWSAPI> | undefined,
    downloadTasks: [] as DownloadTask[],
  }),
  watch: {
    page(value: number) {
      this.refresh();
    },
  },
  methods: {
    reload() {
      this.total = 0;
    },
    async refresh() {
      if (this.refreshing) {
        return;
      }

      this.refreshing = true;

      const result = await api<VideosAPI>("videos/", {
        offset: (this.page - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
        order: "created",
      });

      this.total = result.total;
      this.pages = Math.ceil(this.total / PAGE_SIZE);

      this.videos = result.list.map((video) => new VideoEntry(video));

      this.refreshing = false;

      // scroll to top
      window.scroll(0, 0);
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
        await api<DownloadRetryAPI>("download/retry/", {
          ID: video.videoTask!.id,
        });
      } catch (e) {
        console.warn(e + "");
      }
    },
  },
  created() {
    this.refresh();
    this.trackTasks();
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
    background-color: #555;
  }
}

// don't show a text selector on items rendered as <div> instead of <a>
div.item {
  cursor: default;
}

.author {
  color: inherit;

  &:hover {
    color: var(--v-info-lighten1);
  }
}
</style>
