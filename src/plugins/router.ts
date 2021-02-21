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
function query(this: Vue, params: Record<string, string | number | boolean | null>) {
    const q = { ...this.$route.query };

    for (const key of Object.keys(params)) {
        const value = params[key];

        // delete these falsy values, while keeping the `false` and `0`
        if (value === '' || value === undefined || value === null) {
            delete q[key];
        } else {
            q[key] = String(value);
        }
    }

    return { query: q };
}
