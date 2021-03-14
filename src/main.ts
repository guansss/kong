import { App } from '@/app/App';
import Vue from 'vue';
import VueApp from './App.vue';
import './filters';
import { router } from './pages/router';
import './plugins/router';
import vuetify from './plugins/vuetify';
import './plugins/vuex';

Vue.config.productionTip = false;

Vue.directive('visible', function(el, binding) {
    el.style.visibility = !!binding.value ? 'visible' : 'hidden';
});

// a component to save temporary local variables
// https://dev.to/loilo/an-approach-to-vuejs-template-variables-5aik
Vue.component('TempVar', {
    render() {
        return this.$scopedSlots.default(this.$attrs);
    },
} as any);

(window as any).vueApp = new Vue({
    router,
    vuetify,
    render: h => h(VueApp),
}).$mount('#app');

(window as any).App = App;
