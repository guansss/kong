import VueRouter, { Route } from 'vue-router';

export const router = new VueRouter({
    routes: [
        {
            name: 'home',
            path: '/',
            redirect: { name: 'videos' },
        },
        {
            name: 'videos',
            path: '/videos',
            components: {
                default: () => import('./VideoList/VideoList.vue'),
                bar: () => import('./VideoList/VideoListBar.vue'),
            },
        },
        {
            name: 'video',
            path: '/videos/:id',
            components: {
                default: () => import('./Video/Video.vue'),
                bar: () => import('./Video/VideoBar.vue'),
            },
        },
    ],
});

function getProps(route: Route) {
    return { ...route.params, ...route.query };
}
