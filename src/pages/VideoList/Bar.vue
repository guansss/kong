<template>
  <app-bar title="Videos">
    <v-spacer></v-spacer>
    <v-btn
      icon
      @click="$root.$emit('reload')"
    >
      <v-icon>mdi-reload</v-icon>
    </v-btn>
  </app-bar>
</template>

<script lang="ts">
import Vue from "vue";
import AppBar from '@/components/AppBar.vue'

export default Vue.extend({
  name: "Bar",
  components: {AppBar},
  data: () => ({
  }),
  methods: {
  },
  created() {
  },
  beforeDestroy() {},
});
</script>

<style lang="scss">
</style>
