<template>
  <div class="pt-3">
    <template v-if="visible">
      <v-text-field clearable filled label="Title" v-model="search" @click:clear="searchCleared"></v-text-field>
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
          :filter="searchFilter"
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
          :key="filter.type+filter.label"
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
          >{{ order.startsWith('-') ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
        </v-btn>
      </v-btn-toggle>
    </div>
  </div>
</template>

<script lang="ts">
import { pull } from '@/utils/collection';
import { delay } from '@/utils/misc';
import fuzzysearch from 'fuzzysearch';
import { debounce, DebouncedFunc, Dictionary } from 'lodash';
import Vue from 'vue';
import VueRouter, { NavigationFailure } from 'vue-router';
import {
    CharacterFilterManager,
    CreatorFilterManager,
    TagFilterManager,
    TitleSearchModel,
    toFilter,
    VideoFilter,
} from './FilterManager';

export default Vue.extend({
    name: 'VideoFilters',
    components: {},
    props: {},
    data: () => ({
        visible: false,
        navigating: false,

        creator: new CreatorFilterManager(),
        char: new CharacterFilterManager(),
        tag: new TagFilterManager(),

        filters: [] as VideoFilter[],

        order: '',

        search: '',

        // will be defined in create()
        searchUpdated: undefined as any as DebouncedFunc<() => void>,
    }),
    watch: {
        $route: 'parseQuery',
        search() {
            this.searchUpdated();
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
        searchFilter(filter: VideoFilter, queryText: string, itemText: string): boolean {
            return fuzzysearch(queryText.toLowerCase(), filter.label.toLowerCase());
        },
        async parseQuery() {
            const query = this.$route.query as Dictionary<string>;

            this.search = query.search || '';
            this.order = query.order || '';

            await Promise.all([
                this.creator.parseQuery(query),
                this.char.parseQuery(query),
                this.tag.parseQuery(query),
            ]);

            this.updateFilters(false);
        },
        async searchCleared() {
            // wait for the `search` watcher to be invoked, which then invokes searchUpdated().
            // delay() should be used instead of $nextTick(), otherwise the flush() will not work
            await delay(0);

            // now run it immediately
            this.searchUpdated.flush();
        },
        removeFilter(filter: VideoFilter) {
            switch (filter.type) {
                case 'search':
                    this.search = '';
                    break;

                case 'creator':
                    this.creator.selected = null;
                    break;

                case 'char':
                    pull(this.char.selected, filter);
                    break;

                case 'tag':
                    pull(this.tag.selected, filter);
                    break;

                default:
                    console.warn('Unknown type: ' + filter.type);
            }

            this.updateFilters();
        },
        removeAllFilters() {
            this.creator.selected = null;
            this.char.selected = [];
            this.tag.selected = [];
            this.order = '';
            this.updateFilters();
        },
        async updateFilters(navigate = true) {
            this.filters = [
                this.search && toFilter('search')({ name: this.search } as TitleSearchModel),
                this.creator.selected,
                ...this.char.selected,
                ...this.tag.selected,
            ].filter(Boolean) as VideoFilter[];

            if (navigate) {
                this.navigate();
            }
        },
        setOrder(order: string) {
            if (this.order === order) {
                // invert the order by prefixing the "-", which means ascending
                this.order = '-' + order;
            } else {
                this.order = order;
            }

            this.navigate();
        },
        async navigate() {
            this.navigating = true;

            try {
                await this.$router.push(
                    this.$query({
                        search: this.search,
                        order: this.order,
                        creator: this.creator.toQuery(),
                        char: this.char.toQuery(),
                        tag: this.tag.toQuery(),

                        // remember reset the page number!
                        page: 0,
                    }),
                );
            } catch (e) {
                if ((e as NavigationFailure).type === VueRouter.NavigationFailureType.duplicated) {
                    // just don't bother me with a full stacktrace message
                    console.warn('Navigation duplicated.');
                } else {
                    console.warn(e);
                }
            }

            this.navigating = false;
        },
    },
    async created() {
        this.$root.$on('VideoFilters:visible', this.setVisible);

        // this method must be placed here instead of the `methods` section or else its cancel() method will be undefined
        // https://stackoverflow.com/a/41286377/13237325
        this.searchUpdated = debounce(() => this.updateFilters(), 500);

        this.parseQuery();
    },
    beforeDestroy() {
        this.$root.$off('VideoFilters:visible', this.setVisible);
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
