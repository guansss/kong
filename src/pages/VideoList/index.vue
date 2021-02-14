<template>
  <div>
    <v-row>
      <v-col
        v-for="video in videos"
        :key="video.id"
        cols="4"
      >
        <v-card>{{video.title+' '+new Date(video.created).toLocaleString()}}</v-card>
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
  data: () => ({
    videos: [] as VideoModel[],

    total: 0,
    page: 1,
    pages: 0,
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
</style>
