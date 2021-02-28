<template>
  <div class="pa-3">
    <h2>{{ video.title }}</h2>
    <router-link
        v-if="video.creator"
        class="link d-inline-block my-2 text-h6 text-decoration-none"
        :to="{ name: 'videos', query: { creator: video.creator.id } }"
    >{{ video.creator.name }}</router-link>
    <p class="body-2 text--secondary">{{ video.created | date }}</p>
    <v-rating
        hover
        half-increments
        class="ml-n2"
        color="yellow"
        background-color="yellow lighten-3"
        :readonly="!edit"
        :value="video.rating"
        @input="video.setRating($event)"
    ></v-rating>

    <div
        v-for="manager in [char, tag]"
        :key="manager.label"
        class="d-flex align-center"
    >
      <v-subheader
          class="pl-0"
          style="width: 72px"
      >{{ manager.label }}
      </v-subheader>
      <div class="d-flex flex-wrap align-center">
        <v-chip
            v-for="attr in video[manager.attrKey]"
            :key="attr.id"
            class="mr-2 my-1"
            :color="attr.color"
            :to="!edit ? { name: 'videos', query: { [manager.attrKey]: attr.id+''} } : undefined"
            :close="edit"
            :disabled="attr.removing"
            @click:close="manager.remove(attr)"
        >{{ attr.label }}
        </v-chip>
        <v-btn
            icon
            v-if="edit"
            @click="manager.add.dialog=true"
        >
          <v-icon>mdi-plus</v-icon>
        </v-btn>
      </div>
    </div>

    <v-dialog
        v-for="manager in [char, tag]"
        :key="'add'+manager.label"
        v-model="manager.add.dialog"
        max-width="400px"
    >
      <v-card>
        <v-card-title class="headline">Add {{ manager.label }}</v-card-title>
        <v-card-text>
          <v-autocomplete
              clearable
              return-object
              :filter="search"
              :loading="manager.loading"
              :items="manager.add.candidates"
              v-model="manager.add.selected"
          >
            <template v-slot:selection="{item}">{{ item.label }}</template>
            <template v-slot:item="{item}">
              <v-list-item-content>{{ item.label }}</v-list-item-content>
            </template>
          </v-autocomplete>
          <v-text-field
              clearable
              label="Name"
              :disabled="!!manager.add.selected"
              v-model="manager.add.name"
              @keyup.enter="manager.submitAdd()"
          ></v-text-field>
          <v-text-field
              clearable
              label="Alias"
              :disabled="!!manager.add.selected"
              v-model="manager.add.alias"
              @keyup.enter="manager.submitAdd()"
          ></v-text-field>
        </v-card-text>
        <div
            v-if="manager.add.error"
            class="subtitle-2 error--text"
        >{{ manager.add.error }}
        </div>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
              text
              @click="manager.add.dialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
              text
              :color="manager.add.selected?'primary':'accent'"
              :loading="manager.add.pending"
              :disabled="!manager.add.selected && !manager.add.name"
              @click="manager.submitAdd()"
          >
            {{ manager.add.selected ? 'Select' : 'Create' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import Vue, { PropType } from "vue";
import fuzzysearch from "fuzzysearch";
import { VideoModel } from "@/models";
import {
    AttributeManager,
    CharacterAttributeManager,
    TagAttributeManager,
    toAttribute,
    VideoAttribute,
} from "./AttributeManager";

export default Vue.extend({
    name: "VideoInfo",
    components: {},
    props: {
        video: {
            type: Object as PropType<VideoModel>,
            required: true,
        },
    },
    data() {
        return {
            edit: false,

            char: new CharacterAttributeManager(this.video),
            tag: new TagAttributeManager(this.video),
        };
    },
    computed: {},
    watch: {
        video: {
            immediate: true,
            handler(video: VideoModel) {
                video.chars.forEach(toAttribute("char"));
                video.tags.forEach(toAttribute("tag"));
            },
        },
        "char.add.dialog"() {
            this.dialogChanged(this.char);
        },
        "char.add.selected"() {
            this.selectedChanged(this.char);
        },
        "tag.add.dialog"() {
            this.dialogChanged(this.tag);
        },
        "tag.add.selected"() {
            this.selectedChanged(this.tag);
        },
    },
    methods: {
        setEdit(edit: boolean) {
            this.edit = edit;
        },
        search(attr: VideoAttribute, queryText: string, itemText: string): boolean {
            return fuzzysearch(queryText, attr.label);
        },
        dialogChanged(manager: AttributeManager) {
            if (manager.add.dialog) {
                // reset fields to prevent unexpected operation
                manager.resetAdd();
                manager.updateCandidates();
            }
        },
        selectedChanged(manager: AttributeManager) {
            if (manager.add.selected) {
                manager.add.name = manager.add.selected.name;
                manager.add.alias = manager.add.selected.alias || "";
            }
        },
    },
    created() {
        this.$root.$on("Video:edit", this.setEdit);
    },
    beforeDestroy() {
        this.$root.$off("Video:edit", this.setEdit);
    },
});
</script>

<style lang="scss"></style>
