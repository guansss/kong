import VueRouter, { Route } from 'vue-router';

export const router = new VueRouter({
    routes: [
        {
            name: 'videos',
            path: '/',
            components: {
                default: () => import('./VideoList/index.vue'),
                bar: () => import('./VideoList/Bar.vue'),
            },
            props: {
                default: getProps,
                bar: getProps
            }
        },
        {
            name: 'video',
            path: '/videos/:id',
            components: {
                default: () => import('./Video/index.vue'),
                bar: () => import('./Video/Bar.vue'),
            },
            props: {
                default: true
            }
        }
    ]
});

function getProps(route: Route) {
    return { ...route.params, ...route.query };
}
