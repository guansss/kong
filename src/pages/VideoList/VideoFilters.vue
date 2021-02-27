<template>
  <div class="pt-3">
    <template v-if="visible">
      <v-autocomplete
          clearable
          return-object
          v-for="manager in [creator, char, tag]"
          :key="manager.label"
          :label="manager.label"
          :loading="manager.loading"
          :multiple="manager.multiple"
          class="mb-n2"
          :disabled="navigating"
          :filter="search"
          :items="manager.all"
          item-text="label"
          menu-props="closeOnContentClick"
          v-model="manager.selected"
          @input="updateFilters"
      >
        <template v-slot:selection="{item,attrs}">
          <v-chip
              close
              v-bind="attrs"
              :disabled="navigating"
              :color="item.color"
              @click:close="removeFilter(item)"
          >{{ item.label }}
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
      >{{ filter.label }}
      </v-chip>
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
          <v-icon>mdi-{{ item[1] }}</v-icon>
          <v-icon
              small
              v-if="order.endsWith(item[0])"
          >{{
              order.startsWith('-') ? 'mdi-chevron-up' : 'mdi-chevron-down'
            }}</v-icon>
        </v-btn>
      </v-btn-toggle>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import fuzzysearch from "fuzzysearch";
import { pull } from "@/utils/collection";
import { Dictionary } from "lodash";
import { CharacterFilterManager, CreatorFilterManager, TagFilterManager, VideoFilter } from "./FilterManager";

export default Vue.extend({
    name: "VideoFilters",
    components: {},
    props: {},
    data: () => ({
        visible: false,
        navigating: false,

        creator: new CreatorFilterManager(),
        char: new CharacterFilterManager(),
        tag: new TagFilterManager(),

        filters: [] as VideoFilter[],

        order: "",
    }),
    watch: {
        $route: "parseQuery",
        "creator.add.selected"() {
            this.updateFilters();
        },
        "char.add.selected"() {
            this.updateFilters();
        },
        "tag.add.selected"() {
            this.updateFilters();
        },
    },
    methods: {
        setVisible(value: boolean) {
            this.visible = value;

            if (value) {
                this.initFilters();
            }
        },
        async initFilters() {
            await Promise.all([
                this.creator.init(),
                this.char.init(),
                this.tag.init(),
            ]);
        },
        search(filter: VideoFilter, queryText: string, itemText: string): boolean {
            return fuzzysearch(queryText, filter.label);
        },
        async parseQuery() {
            const query = this.$route.query as Dictionary<string>;

            this.order = query.order || "";

            await Promise.all([
                this.creator.parseQuery(query),
                this.char.parseQuery(query),
                this.tag.parseQuery(query),
            ]);

            this.updateFilters(false);
        },
        removeFilter(filter: VideoFilter) {
            switch (filter.type) {
                case "creator":
                    this.creator.selected = null;
                    break;

                case "char":
                    pull(this.char.selected, filter);
                    break;

                case "tag":
                    pull(this.tag.selected, filter);
                    break;

                default:
                    console.warn("Unknown type: " + filter.type);
            }

            this.updateFilters();
        },
        removeAllFilters() {
            this.creator.selected = null;
            this.char.selected = [];
            this.tag.selected = [];
            this.order = "";
            this.updateFilters();
        },
        async updateFilters(navigate = true) {
            this.filters = [...this.char.selected, ...this.tag.selected];

            if (this.creator.selected) {
                this.filters.unshift(this.creator.selected);
            }

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
                    creator: this.creator.toQuery(),
                    char: this.char.toQuery(),
                    tag: this.tag.toQuery(),
                    order: this.order,
                }),
            );

            this.navigating = false;
        },
    },
    async created() {
        this.$root.$on("VideoFilters:visible", this.setVisible);

        this.parseQuery();
    },
    beforeDestroy() {
        this.$root.$off("VideoFilters:visible", this.setVisible);
    },
});
</script>

<style
    scoped
    lang="scss"
>
.v-icon {
  color: inherit !important;
}
</style>
