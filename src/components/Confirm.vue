<template>
  <v-dialog
      max-width="400px"
      :persistent="action.persistent"
      v-model="visible"
  >
    <v-card>
      <v-card-title class="headline">{{ action.title || 'Confirmation' }}</v-card-title>
      <v-card-text v-text="action.content"></v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
            text
            @click="cancel"
        >{{ action.cancelText || 'Cancel' }}
        </v-btn>
        <v-btn
            text
            color="accent"
            @click="confirm"
        >{{ action.confirmText || 'Confirm' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import Vue from 'vue';

export interface ConfirmAction {
    title?: string;
    content?: string;
    persistent?: boolean;
    confirmText?: string;
    cancelText?: string;
    confirm: (confirmed: boolean) => void;
}

export default Vue.extend({
    name: 'Confirm',
    data: () => ({
        visible: false,

        action: { confirm: () => {} } as Nullable<ConfirmAction>,
    }),
    methods: {
        show(action: ConfirmAction) {
            this.action?.confirm(false);
            this.action = action;
            this.visible = true;
        },
        confirm() {
            this.action?.confirm(true);
            this.visible = false;
        },
        cancel() {
            this.action?.confirm(false);
            this.visible = false;
        },
    },
    created() {
        this.$root.$on('Confirm:show', this.show);
    },
    beforeDestroy() {
        this.$root.$off('Confirm:show', this.show);
    },
});
</script>

<style
    scoped
    lang="scss"
></style>
