<template>
  <v-container class="fill-height d-flex align-center justify-center">
    <div style="width: 400px">
      <pre class="mb-8 text-h3 text-center">{{ currentServer || '(Empty)' }}</pre>
      <v-text-field
          filled
          label="Server"
          v-model="inputServer"
          :rules="[validate]"
          @keyup.enter="submit"
      ></v-text-field>
    </div>
  </v-container>
</template>

<script lang="ts">
import { getProxy, setProxy } from '@/net/apis';
import Vue from 'vue';

export default Vue.extend({
    name: 'Proxy',
    data: () => ({
        currentServer: '',
        inputServer: '',
    }),
    methods: {
        async loadCurrent() {
            this.currentServer = (await getProxy()).server;
        },
        async submit() {
            const config = await setProxy(this.inputServer);

            this.currentServer = config.server;
        },
        validate(value: string) {
            return !!value || 'Required.';
        },
    },
    created() {
        this.loadCurrent();
    },
});
</script>

<style
    scoped
    lang="scss"
></style>
