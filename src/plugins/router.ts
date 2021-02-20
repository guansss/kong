import Vue from 'vue';
import VueRouter, { Route } from 'vue-router';

declare module 'vue/types/vue' {
    export interface Vue {
        $router: VueRouter;
        $route: Route;
        $query: typeof query;
    }
}

Vue.use(VueRouter);

Vue.prototype.$query = query;

/**
 * Gets a query object with given parameters applied, useful for creating a Route.
 */
function query(this: Vue, params: Record<string, string | number | boolean>) {
    return {
        query: {
            ...this.$route.query,
            ...params,
        }
    };
}
