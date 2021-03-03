<template>
  <v-app dark>
    <v-fade-transition mode="out-in">
      <router-view name="bar"></router-view>
    </v-fade-transition>

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
            v-for="item in [['Videos', 'videos'], ['Download','download'], ['Control Room','control-room'], ['Proxy','proxy']]"
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
      <v-fade-transition mode="out-in">
        <router-view></router-view>
      </v-fade-transition>
    </v-main>

    <Confirm/>

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
import Confirm from "@/components/Confirm.vue";

export default Vue.extend({
    name: "App",
    components: { Confirm },
    data: () => ({
        drawer: true,

        snackbar: {
            visible: false,
            message: "",
            timeout: 5000,
        },
    }),
    methods: {
        async reload() {
            const path = this.$route.fullPath;
            this.$router.replace("/nonexisting");
            await this.$nextTick();
            this.$router.replace(path);
        },
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
    created() {
        this.$root.$on("drawer", (open?: boolean) => {
            // open or toggle
            this.drawer = open !== undefined ? open : !this.drawer;
        });
        this.$root.$on("reload", this.reload);
    },
});
</script>

<style
    scoped
    lang="scss"
></style>

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

// the play button
.plyr__control--overlaid {
  top: unset;
  left: 40px;
  bottom: 32px;
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
