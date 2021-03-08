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
        {
            name: 'control-room',
            path: '/control-room',
            components: {
                default: () => import('./ControlRoom/ControlRoom.vue'),
                bar: () => import('./ControlRoom/ControlRoomBar.vue'),
            },
        },
        {
            name: 'proxy',
            path: '/proxy',
            components: {
                default: () => import('./Proxy/Proxy.vue'),
                bar: () => import('@/components/AppBar.vue'),
            },
        },
    ],
});

function getProps(route: Route) {
    return { ...route.params, ...route.query };
}
