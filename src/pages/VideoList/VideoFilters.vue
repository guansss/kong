<template>
  <div>
    <template v-if="visible">
      <v-autocomplete
        chips
        deletable-chips
        multiple
        clearable
        return-object
        label="Character"
        class="mb-n2"
        :disabled="navigating"
        :filter="matchFilter"
        :items="char.chars"
        item-text="label"
        menu-props="closeOnContentClick"
        v-model="char.selected"
        @input="updateFilters"
      >
        <template v-slot:selection="{item,attrs}">
          <v-chip
            close
            v-bind="attrs"
            :disabled="navigating"
            :color="item.color"
            @click:close="removeFilter(item)"
          >
            {{ item.label }}
          </v-chip>
        </template>
      </v-autocomplete>
    </template>

    <div class="d-flex flex-wrap align-center mb-1">
      <v-chip
        close
        v-for="filter in filters"
        :key="filter.type+filter.id"
        class="mr-2 my-1"
        :disabled="navigating"
        :color="filter.color"
        @click:close="removeFilter(filter)"
      >{{filter.label}}</v-chip>
      <v-btn
        icon
        v-if="filters.length"
        :disabled="navigating"
        @click="removeAllFilters"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import fuzzysearch from "fuzzysearch";
import { getCharacters } from "@/net/apis";
import { CharacterModel } from "@/net/models";
import { pull } from "@/utils/collection";

type Filter<T = CharacterModel> = T & {
  id: number;
  type: string;
  color: string;
  label: string;
};

export default Vue.extend({
  name: "VideoFilters",
  components: {},
  props: {},
  data: () => ({
    visible: false,
    navigating: false,

    char: {
      chars: [] as Filter<CharacterModel>[],
      selected: [] as Filter<CharacterModel>[],
    },

    filters: [] as Filter[],
  }),
  watch: {
    $route: "parseFilters",
  },
  methods: {
    setVisible(value: boolean) {
      this.visible = value;
    },
    async loadChars() {
      const chars = await getCharacters();

      this.char.chars = chars.map((char) => ({
        ...char,
        type: "char",
        color: "red darken-2",
        label: `${char.name} (${char.abbr})`,
      }));
    },
    matchFilter(filter: Filter, queryText: string, itemText: string) {
      return (
        fuzzysearch(queryText, filter.name) ||
        (filter.abbr && fuzzysearch(queryText, filter.abbr))
      );
    },
    parseFilters() {
      const query = this.$route.query;

      if (query.char) {
        this.char.selected = this.char.chars.filter((char) =>
          query.char.includes(char.id + "")
        );
      } else {
        this.char.selected = [];
      }

      this.updateFilters(false);
    },
    removeFilter(filter: Filter) {
      if (filter.type === "char") {
        pull(this.char.selected, filter);
      }

      this.updateFilters();
    },
    removeAllFilters() {
      this.char.selected = [];
      this.updateFilters();
    },
    async updateFilters(navigate = true) {
      this.filters = [...this.char.selected];

      if (navigate) {
        this.navigate();
      }
    },
    async navigate() {
      this.navigating = true;

      await this.$router.push(
        this.$query({
          char: this.char.selected.map((char) => char.id).join(","),
        })
      );

      this.navigating = false;
    },
  },
  async created() {
    this.$root.$on("VideoFilters:visible", this.setVisible);

    await this.loadChars();
    this.parseFilters();
  },
  beforeDestroy() {
    this.$root.$off("VideoFilters:visible", this.setVisible);
  },
});
</script>

<style scoped lang="scss">
</style>
