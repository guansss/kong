<template>
  <div class="pa-3">
    <div class="d-flex">
      <router-link
        class="text-decoration-none"
        :to="{name:'videos',query:{author:video.author_id}}"
      >{{video.author_id}}</router-link>
      <span class="ml-auto subtitle-2 text--secondary">{{video.created|date}}</span>
    </div>
    <v-btn
      icon
      :class="{'primary--text':edit}"
      @click="edit=!edit"
    >
      <v-icon>mdi-cog</v-icon>
    </v-btn>
    <div class="d-flex align-center">
      <v-subheader class="pl-0">Character</v-subheader>
      <div class="d-flex flex-wrap align-center">
        <v-chip
          label
          v-for="char in video.chars"
          :key="char.id"
          class="mr-2 my-1"
          :color="char.color"
          :to="!edit?{name:'videos',query:{char:char.id}}:undefined"
          :close="edit"
          :disabled="char.pending"
          @click:close="removeChar(char)"
        >{{`${char.name} (${char.abbr})`}}</v-chip>
        <v-btn
          icon
          v-if="edit"
          @click="char.add.dialog=true"
        >
          <v-icon>mdi-plus</v-icon>
        </v-btn>
      </div>
    </div>

    <v-dialog
      v-model="char.add.dialog"
      max-width="400px"
    >
      <v-card>
        <v-card-title class="headline">Add Character</v-card-title>
        <v-card-text>
          <v-autocomplete
            clearable
            return-object
            :filter="matchChar"
            :loading="char.loading"
            :items="searchableChars"
            v-model="char.add.selected"
          >
            <template v-slot:selection="{item}">{{ `${item.name} (${item.abbr})` }}</template>
            <template v-slot:item="{item}">
              <v-list-item-content>{{ `${item.name} (${item.abbr})` }}</v-list-item-content>
            </template>
          </v-autocomplete>
          <v-text-field
            clearable
            label="Abbriviation"
            :disabled="!!char.add.selected"
            v-model="char.add.abbr"
          ></v-text-field>
          <v-text-field
            clearable
            label="Name"
            :disabled="!!char.add.selected"
            v-model="char.add.name"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <div
            v-if="char.add.error"
            class="subtitle-2 error--text"
          >{{char.add.error}}</div>
          <v-spacer></v-spacer>
          <v-btn
            text
            @click="char.add.dialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            text
            :color="char.add.selected?'primary':'accent'"
            :loading="char.add.pending"
            :disabled="!char.add.selected&&!(char.add.name&&char.add.abbr)"
            @click="submitChar"
          >
            {{char.add.selected?'Select':'Create'}}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import Vue, { PropType } from "vue";
import fuzzysearch from "fuzzysearch";
import {
  getCharacters,
  createCharacter,
  addCharacterToVideo,
  removeCharacterFromVideo,
} from "@/net/apis";
import { VideoModel, CharacterModel } from "@/net/models";
import { hslColor } from "@/utils/string";

interface Character extends CharacterModel {
  color: string;
  pending?: boolean;
}

export default Vue.extend({
  name: "Video",
  components: {},
  props: {
    video: {
      type: Object as PropType<VideoModel>,
      required: true,
    },
  },
  data: () => ({
    edit: false,

    char: {
      loading: false,
      allChars: [] as CharacterModel[],

      add: {
        dialog: false,
        pending: false,
        selected: null as Nullable<CharacterModel>,
        name: "",
        abbr: "",
        error: "",
      },
    },
  }),
  computed: {
    searchableChars() {
      // filter out characters of current video
      return this.char.allChars.filter(
        ({ id }) => !this.video.chars.some((char) => char.id === id)
      );
    },
  },
  watch: {
    "video.chars": {
      immediate: true,
      handler(chars: Character[]) {
        // generate a color for each character
        chars.forEach(
          (char) => (char.color = char.color ?? hslColor(char.name, "80%"))
        );
      },
    },
    "char.add.dialog"(value: boolean) {
      if (value) {
        // resect fields to prevent unexpected operation
        this.char.add.selected = null;
        this.char.add.name = "";
        this.char.add.abbr = "";

        // fetch characters
        if (!this.char.allChars.length) {
          this.refreshAllChars();
        }
      }
    },
    "char.add.selected"(value: CharacterModel | null) {
      if (value) {
        this.char.add.abbr = value.abbr;
        this.char.add.name = value.name;
      }
    },
  },
  methods: {
    async refreshAllChars() {
      if (this.char.loading) {
        return;
      }

      this.char.loading = true;
      this.char.allChars = await getCharacters();
      this.char.loading = false;
    },
    async removeChar(char: Character) {
      if (char.pending) {
        return;
      }

      char.pending = true;

      try {
        await removeCharacterFromVideo(this.video.id, char.id);

        this.video.chars.splice(this.video.chars.indexOf(char), 1);
      } catch (e) {
        console.warn(e);
      }

      char.pending = false;
    },
    matchChar(char: CharacterModel, queryText: string, itemText: string) {
      return (
        fuzzysearch(queryText, char.name) ||
        (char.abbr && fuzzysearch(queryText, char.abbr))
      );
    },
    async submitChar() {
      if (this.char.add.pending) {
        return;
      }

      this.char.add.error = "";
      this.char.add.pending = true;

      try {
        let added!: CharacterModel;

        if (this.char.add.selected) {
          added = this.char.add.selected;

          await addCharacterToVideo(this.video.id, added.id);
        } else if (this.char.add.name && this.char.add.abbr) {
          added = await createCharacter(
            this.char.add.name,
            this.char.add.abbr,
            this.video.id
          );
        }

        this.video.chars.push(added);
        this.char.allChars.push(added);

        this.char.add.dialog = false;
      } catch (e) {
        this.char.add.error = e + "";
      }

      this.char.add.pending = false;
    },
  },
  created() {},
});
</script>

<style lang="scss">
</style>
