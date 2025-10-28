<script setup lang="js">
import {
  changePage,
  process,
  selectCandidateOnCurrentPage,
  setIME,
  setOption,
  setPageSize,
  isPrintable,
} from '@/services/IME/Provider';
import { pipe } from '@/utils/promise';
import {
  defineProps,
  ref,
  watch,
  defineEmits,
} from "vue";

const props = defineProps({
  pageSize: {
    type: Number,
    default: 10,
  },
});
const value = defineModel({ default: '' });

/** 输入保留的前缀 */
const preEditSequence = ref('');
/** 输入保留的后缀 */
const postEditSequence = ref('');

const compositing = ref({
  inputs: [],
  compositing: false,
});

const candidates = ref([]);
const pagination = ref({
  current: 0,
  isLastPage: false,
  totalPages: 0,
});

async function analyze(result, keycode) {
  console.log(result, compositing.value);
  if (result.state === 0) {
    // COMMITTED
    const committed = preEditSequence.value + result.committed + postEditSequence.value;
    value.value = committed;
    preEditSequence.value = committed;
    postEditSequence.value = '';
    reset();
  } else if (result.state === 1) {
    // ACCEPTED
    const unprocessed = result.tail.split('');
    const broken = result.body.split(' ');
    if (unprocessed.length > 0) {
      broken.push(...unprocessed);
    }
    if (result.head) {
      broken.unshift(result.head);
    }

    const possible = result.candidates.map((c) => c.text);
    if (possible.length === 0) {
      possible.push(broken.at(-1));
    }

    compositing.value.inputs = broken;
    candidates.value = possible;
    pagination.value.current = result.page;
    pagination.value.isLastPage = result.isLastPage || possible.length < props.pageSize;
  } else {
    compositing.value.compositing = false;
    if (result.state === 2) {
      // REJECTED
      reset();
      if (result.updatedSchema) {
        await setIME(result.updatedSchema.split('/')[0]);
      }
    }
    if (result.state === 3 && isPrintable(keycode)) {
      // UNHANDLED
      analyze({ state: 0, committed: keycode });
    }
  }
}

const gotoPage = (page) => {
  changePage(page < pagination.value.current)
    .then((result) => JSON.parse(result))
    .then(analyze);
  pagination.value.current = Math.max(page, 0);
};

const reset = () => {
  compositing.value.inputs = [];
  compositing.value.compositing = false;
  candidates.value = [];
  pagination.value.current = 0;
  pagination.value.isLastPage = false;
  process('{space}');
};

const selectCandidate = async (candidate, candidateIndex) => {
  try {
    if (/[0-9a-z]{1}/i.test(candidate)) {
      await pipe('{space}', process, analyze);
    } else {
      await pipe(candidateIndex, selectCandidateOnCurrentPage, JSON.parse, analyze);
    }
  } catch (e) {
    console.error(e);
    reset();
  }
};

const onKeyPress = (keycode) => {
  let command = keycode;
  if (keycode === '{BackSpace}') {
    // rime 处理最后一个 backspace 和 rawInput 的 backspace 时，不是我们想要的 state
    if (!compositing.value.compositing) {
      const cut = Array.from(value.value);
      preEditSequence.value = '';
      cut.pop();
      analyze({ state: 0, committed: cut.join('') });
      return;
    }
  }

  compositing.value.compositing = true;
  return pipe(command, process, analyze);
};

watch(
  () => props.pageSize,
  (size) => {
    setPageSize(size);
  },
  { immediate: true },
);
defineExpose({
  gotoPage,
  reset,
  init: (keep) => {
    preEditSequence.value = keep;
    postEditSequence.value = '';
    reset();
  },
  setOption,
  onKeyPress,
});
</script>

<template>
  <div class="candidates">
    <section class="preview">{{ compositing.inputs.join("'") }}</section>
    <section class="row">
      <v-btn
        variant="flat"
        v-for="(item, index) in candidates"
        :key="index"
        class="item"
        @click.prevent="selectCandidate(item, index)"
      >
        {{ item }}
      </v-btn>
    </section>
    <section class="actions">
      <v-btn
        variant="text"
        :disabled="pagination.current <= 0"
        @click.stop="gotoPage(pagination.current - 1)"
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
        :disabled="
          pagination.isLastPage ||
          (pagination.totalPages > 0 && pagination.current > pagination.totalPages)
        "
        @click.stop="gotoPage(pagination.current + 1)"
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
      <span class="page-info">
        {{ pagination.current + 1 }}
        {{ pagination.totalPages > 0 ? ' / ' + pagination.totalPages : '' }}</span
      >
    </section>
  </div>
</template>

<style lang="scss" scoped>
.candidates {
  font-family: SourceHanSans, Ariral, Plangothic;
  width: 100%;
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
    overflow: auto;
    scrollbar-width: thin;

    gap: 0.2em;
    flex: 1;

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
