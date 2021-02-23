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
        class="mr-2"
        :disabled="navigating"
        :color="filter.color"
        @click:close="removeFilter(filter)"
      >{{filter.label}}</v-chip>
      <v-spacer></v-spacer>
      <v-btn
        icon
        v-if="filters.length||order"
        class="mr-2"
        :disabled="navigating"
        @click="removeAllFilters"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
      <v-btn-toggle
        dense
        borderless
        color="primary"
        active-class="primary--text"
        :mandatory="!!order"
      >
        <v-btn
          v-for="item in [['rating','star'],['created','clock-outline']]"
          :key="item[0]"
          @click="setOrder(item[0])"
        >
          <v-icon>mdi-{{item[1]}}</v-icon>
          <v-icon
            small
            v-if="order.endsWith(item[0])"
          >{{order.startsWith('-')?'mdi-chevron-up':'mdi-chevron-down'}}</v-icon>
        </v-btn>
      </v-btn-toggle>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import fuzzysearch from "fuzzysearch";
import { getCharacters } from "@/net/apis";
import { CharacterModel } from "@/models";
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

    order: "",

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
        label: char.name + (char.alias ? ` (${char.alias})` : ""),
      }));
    },
    matchFilter(filter: Filter, queryText: string, itemText: string) {
      return (
        fuzzysearch(queryText, filter.name) ||
        (filter.alias && fuzzysearch(queryText, filter.alias))
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

      this.order = (query.order as string) || "";

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
      this.order = "";
      this.updateFilters();
    },
    async updateFilters(navigate = true) {
      this.filters = [...this.char.selected];

      if (navigate) {
        this.navigate();
      }
    },
    setOrder(order: string) {
      if (this.order === order) {
        // invert the order by prefixing the "-", which means ascending
        this.order = "-" + order;
      } else {
        this.order = order;
      }

      this.navigate();
    },
    async navigate() {
      this.navigating = true;

      await this.$router.push(
        this.$query({
          char: this.char.selected.map((char) => char.id).join(","),
          order: this.order,
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
.v-icon {
  color: inherit !important;
}
</style>
