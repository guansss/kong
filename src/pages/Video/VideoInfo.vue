<template>
  <div class="pa-3">
    <div class="d-flex">
      <router-link
        class="text-decoration-none"
        :to="{name:'videos',query:{author:video.author_id}}"
      >{{video.author_id}}</router-link>
      <span class="ml-auto subtitle-2 text--secondary">{{video.created|date}}</span>
    </div>
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
    <div class="d-flex align-center">
      <v-subheader class="pl-0">Character</v-subheader>
      <div class="d-flex flex-wrap align-center">
        <v-chip
          v-for="char in video.chars"
          :key="char.id"
          class="mr-2 my-1"
          color="red darken-2"
          :to="!edit?{name:'videos',query:{char:char.id+''}}:undefined"
          :close="edit"
          :disabled="char.pending"
          @click:close="removeChar(char)"
        >{{char.label}}</v-chip>
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
            <template v-slot:selection="{item}">{{ item.label }}</template>
            <template v-slot:item="{item}">
              <v-list-item-content>{{ item.label }}</v-list-item-content>
            </template>
          </v-autocomplete>
          <v-text-field
            clearable
            label="Name"
            :disabled="!!char.add.selected"
            v-model="char.add.name"
            @keyup.enter="submitChar"
          ></v-text-field>
          <v-text-field
            clearable
            label="Alias"
            :disabled="!!char.add.selected"
            v-model="char.add.alias"
            @keyup.enter="submitChar"
          ></v-text-field>
        </v-card-text>
        <div
          v-if="char.add.error"
          class="subtitle-2 error--text"
        >{{char.add.error}}</div>
        <v-card-actions>
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
            :disabled="!char.add.selected&&!char.add.name"
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
import { getCharacters, removeCharacterFromVideo } from "@/net/apis";
import { VideoModel, CharacterModel } from "@/models";

interface Character extends CharacterModel {
  pending?: boolean;
  label: string;
}

function getLabel(item: CharacterModel) {
  return item.name + (item.alias ? ` (${item.alias})` : "");
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

      // all available characters
      allChars: [] as Character[],

      add: {
        dialog: false,
        pending: false,
        selected: null as Nullable<Character>,
        name: "",
        alias: "",
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
    video: {
      immediate: true,
      handler(video: VideoModel) {
        video.chars.forEach((char) => {
          (char as Character).label = getLabel(char);
        });
      },
    },
    "char.add.dialog"(value: boolean) {
      if (value) {
        // resect fields to prevent unexpected operation
        this.char.add.selected = null;
        this.char.add.name = "";
        this.char.add.alias = "";

        // fetch characters
        if (!this.char.allChars.length) {
          this.refreshAllChars();
        }
      }
    },
    "char.add.selected"(value: CharacterModel | null) {
      if (value) {
        this.char.add.alias = value.alias || "";
        this.char.add.name = value.name;
      }
    },
  },
  methods: {
    setEdit(edit: boolean) {
      this.edit = edit;
    },
    async refreshAllChars() {
      if (this.char.loading) {
        return;
      }

      this.char.loading = true;

      const chars = await getCharacters();
      this.char.allChars = chars.map((char) =>
        Object.assign(char, { label: getLabel(char) })
      );

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
        (char.alias && fuzzysearch(queryText, char.alias))
      );
    },
    async submitChar() {
      if (this.char.add.pending) {
        return;
      }

      this.char.add.error = "";
      this.char.add.pending = true;

      try {
        let added!: Character;

        if (this.char.add.selected) {
          added = this.char.add.selected;

          await this.video.addCharacter(added);
        } else if (this.char.add.name) {
          const created = await this.video.addNewCharacter(
            this.char.add.name,
            this.char.add.alias
          );

          added = Object.assign(created, { label: getLabel(created) });
        }

        this.char.allChars.push(added);

        this.char.add.dialog = false;
      } catch (e) {
        this.char.add.error = e + "";
      }

      this.char.add.pending = false;
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

<style lang="scss">
</style>
