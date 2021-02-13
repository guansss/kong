import Vue from 'vue';
import VueApp from './App.vue';
import vuetify from './plugins/vuetify';
import { App } from '@/app/App';

Vue.config.productionTip = false;

Vue.directive('visible', function (el, binding) {
    el.style.visibility = !!binding.value ? 'visible' : 'hidden';
});

(window as any).vueApp = new Vue({
    vuetify,
    render: h => h(VueApp),
}).$mount('#app');

(window as any).App = App;
