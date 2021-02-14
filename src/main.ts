import Vue from 'vue';
import VueApp from './App.vue';
import vuetify from './plugins/vuetify';
import './plugins/router';
import { App } from '@/app/App';
import { router } from './pages/router';

Vue.config.productionTip = false;

Vue.directive('visible', function (el, binding) {
    el.style.visibility = !!binding.value ? 'visible' : 'hidden';
});

(window as any).vueApp = new Vue({
    router,
    vuetify,
    render: h => h(VueApp),
}).$mount('#app');

(window as any).App = App;
