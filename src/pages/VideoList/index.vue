<template>
  <div class="pb-4 w100">
    <v-row class="px-md-5 py-5">
      <v-col
        v-for="video in videos"
        :key="video.id"
        class="pa-2"
        cols="6"
        md="4"
      >
        <v-card
          :href="'#'+video.id"
          class="item"
        >
          <v-img
            :src="video.thumb&&staticServer+'/test.jpg'"
            :aspect-ratio="16/9"
          >
          </v-img>
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
import { VideoModel, VideosAPI } from "@/net/models";

const PAGE_SIZE = 24;

export default Vue.extend({
  name: "VideoList",
  components: {},
  filters: {
    date: (time: number) => new Date(time).toLocaleString(),
  },
  data: () => ({
    videos: [] as VideoModel[],

    total: 0,
    page: 1,
    pages: 0,

    staticServer: process.env.VUE_APP_STATIC_SERVER,
  }),
  watch: {
    page(value: number) {
      this.refresh();
    },
  },
  methods: {
    async refresh() {
      const result = await api<VideosAPI>("videos/", {
        offset: (this.page - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
      });

      this.videos = result.list;
      this.total = result.total;
      this.pages = Math.ceil(this.total / PAGE_SIZE);
    },
  },
  created() {
    this.refresh();
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

.author {
  color: inherit;

  &:hover{
    color: var(--v-info-lighten1)
  }
}
</style>
