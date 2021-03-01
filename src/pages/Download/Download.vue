<template>
  <v-container class="pt-0">
    <v-list>
      <template
          v-for="(task,index) in manager.tasks"
      >
        <v-list-item
            :key="task.id"
        >
          <div class="flex-row align-center">
            <v-btn
                icon
                large
                @click="manager.remove(task.id)"
            >
              <v-icon>mdi-close</v-icon>
            </v-btn>
            <v-btn
                icon
                large
                class="mx-3"
                :disabled="!(task.startable || task.state === DownloadTaskState.LOADING)"
                @click="toggleStart(task)"
            >
              <v-icon>mdi-{{ task.state === DownloadTaskState.LOADING ? 'pause' : 'play' }}</v-icon>
            </v-btn>
          </div>
          <v-divider vertical/>
          <div
              class="align-self-center d-flex flex-column align-center"
              style="width: 80px"
          >
            <v-icon>mdi-{{ task.type === 'image' ? 'image' : 'movie' }}</v-icon>
            <span class="mt-1 ml-1">{{ task.progress }}</span>
          </div>
          <v-list-item-content>
            <v-list-item-title>{{ task.name }}</v-list-item-title>
            <v-list-item-subtitle class="my-2">
              <span class="mr-2 text--primary">{{ task.speed|size }}/s</span>
              {{ task.loaded|size }} / {{ task.size|size }}
            </v-list-item-subtitle>
            <v-list-item-subtitle>{{
                DownloadTaskState[task.state] + (task.error ? ` (${task.error})` : '')
              }}
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>

        <v-divider
            v-if="index < manager.tasks.length - 1"
            :key="index"
        />
      </template>
    </v-list>
  </v-container>
</template>

<script lang="ts">
import Vue from 'vue';
import { DownloadTaskModel, DownloadTaskState } from '@/models';
import { DownloadManager } from '@/tools/DownloadManager';

export default Vue.extend({
    name: "Download",
    data: () => ({
        DownloadTaskState,
        manager: new DownloadManager(),
    }),
    methods: {
        toggleStart(task: DownloadTaskModel) {
            if (task.startable) {
                task.start();
            } else if (task.state === DownloadTaskState.LOADING) {
                task.stop();
            } else {
                console.warn('Invalid state:', DownloadTaskState[task.state]);
            }
        },
    },
    beforeDestroy() {
        this.manager.destroy();
    },
});
</script>

<style
    scoped
    lang="scss"
></style>
