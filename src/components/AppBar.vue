<template>
  <v-app-bar
      app
      color="primary"
      v-bind="$attrs"
      v-on="$listeners"
  >
    <v-container
        :fluid="fluid"
        class="d-flex align-center"
    >
      <v-app-bar-nav-icon @click="$root.$emit('drawer')"></v-app-bar-nav-icon>
      <v-toolbar-title v-if="barTitle">{{ barTitle }}</v-toolbar-title>

      <slot />
    </v-container>

    <template
        v-if="$scopedSlots.extension"
        v-slot:extension
    >
      <slot name="extension" />
    </template>
  </v-app-bar>
</template>

<script lang="ts">
import { startCase } from 'lodash';
import Vue from 'vue';

export default Vue.extend({
    name: 'AppBar',
    props: {
        title: String,
        fluid: Boolean,
    },
    computed: {
        barTitle() {
            return this.title !== undefined ? this.title : startCase(this.$route.name as string);
        },
    },
});
</script>

<style lang="scss"></style>
