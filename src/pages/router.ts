import VueRouter from 'vue-router';

export const router = new VueRouter({
    routes: [
        { path: '/', component: () => import('./VideoList') }
    ]
});
