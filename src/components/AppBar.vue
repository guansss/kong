<template>
  <v-app-bar
    app
    color="primary"
    v-bind="$attrs"
    v-on="$listeners"
  >
    <v-app-bar-nav-icon @click="$root.$emit('drawer')"></v-app-bar-nav-icon>
    <v-toolbar-title v-if="title">{{title}}</v-toolbar-title>

    <slot />

    <template
      v-if="$scopedSlots.extension"
      v-slot:extension
    >
      <slot name="extension" />
    </template>
  </v-app-bar>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "AppBar",
  props: {
    title: String,
  },
});
</script>

<style lang="scss">
</style>
