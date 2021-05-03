<template>
  <v-app dark>
    <router-view name="bar"></router-view>

    <v-navigation-drawer
        app
        v-model="drawer"
    >
      <v-list-item>
        <v-list-item-content>
          <v-list-item-title class="text-h4">Kong</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-divider></v-divider>
      <v-list>
        <v-list-item
            exact
            v-for="item in [['Videos', 'videos'], ['Control Room','control-room'], ['Proxy','proxy']]"
            :key="item[0]"
            :to="{name: item[1]}"
        >
          <v-list-item-content>
            <v-list-item-title>{{ item[0] }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <v-fade-transition duration="100">
        <router-view></router-view>
      </v-fade-transition>
    </v-main>

    <Confirm />

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

    <div v-if="splash" class="splash">
      <a class="title text-h1" @click="splash=false">Kong</a>
    </div>
  </v-app>
</template>

<script lang="ts">
import Confirm from '@/components/Confirm.vue';
import { destroySession, sessionExpired, startSession } from '@/tools/session';
import Vue from 'vue';

export default Vue.extend({
    name: 'App',
    components: { Confirm },
    data: () => ({
        drawer: false,

        splash: false,

        snackbar: {
            visible: false,
            message: '',
            timeout: 5000,
        },
    }),
    methods: {
        async reload() {
            const path = this.$route.fullPath;
            await this.$router.replace('/nonexistent');
            await this.$nextTick();
            await this.$router.replace(path);
        },
        snack(message: string, timeout: number = 5000) {
            this.snackbar.message = message;
            this.snackbar.timeout = timeout;
            this.snackbar.visible = true;
        },
        error(e: any) {
            const message = (e && e.message) || e + '';

            if (message) {
                this.snack(message, -1);
            }
        },
        log(...args: any[]) {
            console.log(...args);
        },
    },
    created() {
        this.$root.$on('drawer', (open?: boolean) => {
            // open or toggle
            this.drawer = open !== undefined ? open : !this.drawer;
        });
        this.$root.$on('reload', this.reload);

        if (sessionExpired()) {
            this.splash = true;
        }

        startSession();
    },
    beforeDestroy() {
        destroySession();
    },
});
</script>

<style
    scoped
    lang="scss"
>
.splash {
  position: fixed;
  z-index: 999;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  backdrop-filter: blur(30px);

  .title {
    position: absolute;
    right: 36px;
    bottom: 80px;
    color: #FFF;
    font-size: 10rem !important;
    transition: letter-spacing .2s ease-out;

    &:hover {
      letter-spacing: 0.05em !important;
    }
  }
}
</style>

<style lang="scss">
@import "plyr";

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
  text-decoration: none;

  &:hover {
    filter: brightness(150%);
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
