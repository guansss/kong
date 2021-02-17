import VueRouter from 'vue-router';

export const router = new VueRouter({
    routes: [
        {
            path: '/',
            component: () => import('./VideoList/index.vue'),
            meta: {
                title: 'Kong'
            }
        },
        {
            path: '/videos/:id',
            component: () => import('./Video/index.vue'),
            props: true
        }
    ]
});
