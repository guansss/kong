<template>
  <app-bar title="Videos">
    <v-spacer></v-spacer>
    <v-btn
        icon
        @click="$root.$emit('reload')"
    >
      <v-icon>mdi-reload</v-icon>
    </v-btn>
    <v-btn
        icon
        @click="toggleFilters"
    >
      <v-icon>{{ filtersVisible ? 'mdi-filter' : 'mdi-filter-outline' }}</v-icon>
    </v-btn>
  </app-bar>
</template>

<script lang="ts">
import AppBar from '@/components/AppBar.vue';
import Vue from 'vue';

export default Vue.extend({
    name: 'VideoListBar',
    components: { AppBar },
    data: () => ({
        filtersVisible: false,
    }),
    methods: {
        toggleFilters() {
            this.filtersVisible = !this.filtersVisible;
            this.$root.$emit('VideoFilters:visible', this.filtersVisible);
        },
    },
    created() {},
    beforeDestroy() {},
});
</script>

<style lang="scss"></style>
