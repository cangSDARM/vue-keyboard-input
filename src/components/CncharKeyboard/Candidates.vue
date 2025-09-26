<script setup lang="js">
import Lo from 'lodash';
import {ref, defineProps, defineEmits, defineOptions, defineExpose, onMounted,watch, useTemplateRef, computed} from 'vue';
import { wordBreak } from './utils';

const MatchableRegex = /[a-z]+$/i;

const props = defineProps({
  pageSize: {
    type: Number,
    default: 10,
  },
});

let compositedCallback;
const compositing = ref({
  inputs: [],
  index: 0,
  compositing: false,
  kept: '',
});

const candidates = ref([]);
const currentPage = ref(0);

const totalPages = computed(() => {
  return Math.ceil(candidates.value.length / props.pageSize) || 1;
});
const pagedCandidates = computed(() => {
  const start = currentPage.value * props.pageSize;
  return candidates.value.slice(start, start + props.pageSize);
});

const setCandidates = (cands = []) => {
  candidates.value = cands;
};
const setCompositing = ({ inputs, index, kept }) => {
  compositing.value.compositing = true;
  compositing.value.inputs = inputs;
  compositing.value.index = index;
  if (kept) {
    compositing.value.kept = kept;
  }
};
const resetCompositing = () => {
  compositing.value.compositing = false;
  compositing.value.inputs = [];
  compositing.value.index = 0;
  compositing.value.kept = '';
};

const gotoPage = (page) => {
  currentPage.value = Math.max(page, 0);
};

const reset = () => {
  candidates.value = [];
  gotoPage(0);
  resetCompositing();
};

const selectCandidate = async (candidate) => {
  const len = Array.from(candidate).length;

  // 上一次的所有结果
  const composited = compositing.value.inputs.slice(0, compositing.value.index).concat(candidate);
  const index = compositing.value.index + len;

  const rawInput = compositing.value.inputs.slice(index).join('');
  try {
    const [broken, candidates] = await wordBreak(rawInput);

    setCompositing({ inputs: composited.concat(broken), index: compositing.value.index + 1 });
    if (broken.length === 0) {
      compositedCallback?.(compositing.value.kept + compositing.value.inputs.join(''));
      reset();
    }

    setCandidates(candidates);
    gotoPage(0); // 每次更新重置到第一页
  } catch (e) {
    console.error(e);
    reset();
  }
};

const update = (rawInput = '', callback) => {
  compositedCallback = callback;
  // found compositable alphabets
  const matched = rawInput.match(MatchableRegex);
  if (!rawInput || !matched) {
    reset();
    return;
  }

  const kept = rawInput.substring(0, matched.index);

  wordBreak(matched[0]).then(([broken, candidates]) => {
    setCompositing({ inputs: broken, index: 0, kept });

    setCandidates(candidates);
    gotoPage(0); // 每次更新重置到第一页
  }).catch((e) => {
    console.error(e);
    reset();
  });
};

const debouncedUpdate = Lo.debounce(update, 50);

defineExpose({ gotoPage, update: debouncedUpdate, reset });
</script>

<template>
  <div class="candidates" v-show="compositing.compositing">
    <section class="preview">{{ compositing.inputs.join("'") }}</section>
    <section class="row">
      <v-btn
        variant="flat"
        v-for="(item, index) in pagedCandidates"
        :key="index"
        class="item"
        @click.prevent="selectCandidate(item)"
      >
        {{ item }}
      </v-btn>
    </section>
    <section class="actions">
      <v-btn
        variant="text"
        :disabled="currentPage <= 0"
        @click.stop="gotoPage(currentPage - 1)"
        class="page-btn"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M10 12L6 8L10 4"
            stroke="#666"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </v-btn>
      <v-btn
        variant="text"
        :disabled="currentPage >= totalPages"
        @click.stop="gotoPage(currentPage + 1)"
        class="page-btn"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M6 4L10 8L6 12"
            stroke="#666"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </v-btn>
      <span class="page-info">{{ currentPage + 1 }} / {{ totalPages }}</span>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.candidates {
  padding: 4px 6px;
  background: rgb(var(--v-theme-surface));
  position: relative;

  font-size: 1.25em;
  border-top: 1px solid #ddd;
  border-radius: 6px;

  display: flex;
  flex-direction: row;
  align-items: center;
  flex-wrap: nowrap;

  .preview {
    cursor: default;
    position: absolute;
    top: 0;
    transform: translateY(-100%);
    display: flex;
    background-color: #888;
    color: white;
  }

  .row {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    flex-wrap: nowrap;

    gap: 0.2em;
    flex: 1;
    overflow: hidden;

    .item {
      min-width: unset;
      user-select: none;
      font-size: 1em !important;

      padding: 0 2px;

      cursor: pointer;
    }
  }

  .actions {
    .page-info {
      margin-left: 12px;
      color: #888;

      font-size: 0.8em;
      font-weight: 500;

      text-align: center;
      letter-spacing: 1px;
    }
  }
}
</style>
