<template>
  <app-bar
      :absolute="ready"
      fluid
      title="Control Room"
  >
    <v-spacer></v-spacer>
    <v-btn
        icon
        title="Ready"
        @click="toggleReady"
    >
      <v-icon>mdi-emoticon{{ ready ? '' : '-devil' }}</v-icon>
    </v-btn>
    <v-btn
        icon
        title="Edit"
        @click="toggleEdit"
    >
      <v-icon>{{ edit ? 'mdi-cog-off' : 'mdi-cog' }}</v-icon>
    </v-btn>
  </app-bar>
</template>

<script lang="ts">
import Vue from "vue";
import AppBar from "@/components/AppBar.vue";

export default Vue.extend({
    name: "ControlRoomBar",
    components: { AppBar },
    data: () => ({
        edit: false,
        ready: false,
    }),
    methods: {
        toggleEdit() {
            this.edit = !this.edit;
            this.$root.$emit("ControlRoom:edit", this.edit);
        },
        toggleReady() {
            this.ready = !this.ready;
            this.$root.$emit('ControlRoom:ready', this.ready);
        },
        setReady(ready: boolean) {
            this.ready = ready;
        },
    },
    created() {
        this.$root.$on('ControlRoom:isReady', this.setReady);
    },
    beforeDestroy() {
        this.$root.$off('ControlRoom:isReady', this.setReady);
    },
});
</script>

<style lang="scss"></style>
