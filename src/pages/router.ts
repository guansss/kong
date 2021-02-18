import VueRouter from 'vue-router';

export const router = new VueRouter({
    routes: [
        {
            path: '/',
            components: {
                default: () => import('./VideoList/index.vue'),
                bar: () => import('./VideoList/Bar.vue'),
            },
            meta: {
                title: 'Kong'
            }
        },
        {
            path: '/videos/:id',
            components: {
                default: () => import('./Video/index.vue'),
            },
            props: true
        }
    ]
});
