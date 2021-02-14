<template>
  <v-app dark>
    <v-app-bar
      app
      color="primary"
    >
      <v-app-bar-nav-icon @click="drawer = true"></v-app-bar-nav-icon>
      <v-toolbar-title>{{$route.meta.title}}</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn
        icon
        href="#"
      >
        <v-icon>mdi-download</v-icon>
      </v-btn>
    </v-app-bar>
    <v-navigation-drawer
      app
      v-model="drawer"
    >
      <v-toolbar color="primary">
        <v-toolbar-title>Kong</v-toolbar-title>
      </v-toolbar>
    </v-navigation-drawer>
    <v-main>
      <v-container
        fluid
        class="pa-0 fill-height flex-column"
      >
        <v-fade-transition mode="out-in">
          <router-view></router-view>
        </v-fade-transition>
      </v-container>
    </v-main>

    <v-snackbar
      v-model="snackbar.visible"
      :timeout="snackbar.timeout"
    >
      {{ snackbar.message }}
      <template v-slot:action="{ attrs }">
        <v-btn
          icon
          v-bind="attrs"
          @click="snackbar.visible=false"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "App",
  components: {},
  data: () => ({
    drawer: false,

    snackbar: {
      visible: false,
      message: "",
      timeout: 5000,
    },
  }),
  methods: {
    snack(message: string, timeout: number = 5000) {
      this.snackbar.message = message;
      this.snackbar.timeout = timeout;
      this.snackbar.visible = true;
    },
    error(e: any) {
      const message = (e && e.message) || e + "";

      if (message) {
        this.snack(message, -1);
      }
    },
    log(...args: any[]) {
      console.log(...args);
    },
  },
  created() {},
});
</script>

<style scoped lang="scss">
</style>

<style lang="scss">
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.overflow-y-hidden.dont-hide-the-fucking-scrollbar {
  overflow-y: scroll !important;
}

.w100 {
  width: 100%;
}

a.link {
  transition: color 0.15s ease-out;

  &:hover {
    color: var(--v-info-lighten2);
  }
}

// https://github.com/vuetifyjs/vuetify/issues/7283#issuecomment-572276385
// Reversed input variant
.v-input--reverse .v-input__slot {
  flex-direction: row-reverse;
  justify-content: flex-end;

  .v-input--selection-controls__input {
    margin-right: 0;
    margin-left: 8px;
  }

  .v-label {
    display: block;
    flex: 1;
  }
}
</style>
