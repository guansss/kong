import VueRouter from 'vue-router';

export const router = new VueRouter({
    routes: [
        {
            name: 'videos',
            path: '/',
            components: {
                default: () => import('./VideoList/index.vue'),
                bar: () => import('./VideoList/Bar.vue'),
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
