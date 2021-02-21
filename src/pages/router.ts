import VueRouter, { Route } from 'vue-router';

export const router = new VueRouter({
    routes: [
        {
            name: 'home',
            path: '/',
            redirect: { name: 'videos' }
        },
        {
            name: 'videos',
            path: '/videos',
            components: {
                default: () => import('./VideoList/index.vue'),
                bar: () => import('./VideoList/Bar.vue'),
            },
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
