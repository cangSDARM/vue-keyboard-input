import {
  changePage,
  isPrintable,
  process,
  selectCandidateOnCurrentPage,
  setIME,
  setOption,
  setPageSize,
} from "@/services/IME/Provider";
import type { RIME_RESULT } from "@/services/IME/type";
import { pipe } from "@/utils/promise";
import { debounce } from "lodash";
import { useInputCursor } from "./utils";
import { computed, ref, watch, type Ref, type ShallowRef } from "vue";

// XXX: unify two of those compositor

export { setOption };

export type Pagination = {
  current: number;
  isLastPage: boolean;
  totalPages: 0;
};
export type HandwritePad = {
  clean: () => void;
};

export const Compositors = {
  Keyboard: 0,
  Handwrite: 1,
} as const;

const backspaceComposite = (cursor: ReturnType<typeof useInputCursor>) => {
  const prior = Array.from(cursor.prior.value);
  prior.pop();
  cursor.prior.value = prior.join("");
};

const useRimeCompositor = (props: {
  pageSize: number;
  value: Ref<string>;
  cursor: ReturnType<typeof useInputCursor>;
}) => {
  const compositing = ref({
    inputs: [] as string[],
    compositing: false,
  });

  const candidates = ref<string[]>([]);
  const pagination = ref<Pagination>({
    current: 0,
    isLastPage: false,
    totalPages: 0,
  });

  async function analyze(result: RIME_RESULT, keycode?: string) {
    console.log(result, compositing.value, props.cursor.range.value);
    if (result.state === 0) {
      // COMMITTED
      const committed =
        props.cursor.prior.value +
        result.committed +
        props.cursor.posterior.value;
      props.value.value = committed;
      reset();
    } else if (result.state === 1) {
      // ACCEPTED
      const unprocessed = result.tail.split("");
      const broken = result.body.split(" ");
      if (unprocessed.length > 0) {
        broken.push(...unprocessed);
      }
      if (result.head) {
        broken.unshift(result.head);
      }

      const possible = result.candidates.map((c) => c.text);
      if (possible.length === 0) {
        possible.push(broken.at(-1)!);
      }

      compositing.value.inputs = broken;
      candidates.value = possible;
      pagination.value.current = result.page;
      pagination.value.isLastPage =
        result.isLastPage || possible.length < props.pageSize;
    } else {
      compositing.value.compositing = false;
      if (result.state === 2) {
        // REJECTED
        reset();
        if (result.updatedSchema) {
          await setIME(result.updatedSchema.split("/")[0]);
        }
      }
      if (result.state === 3 && keycode && isPrintable(keycode)) {
        // UNHANDLED
        analyze({ state: 0, committed: keycode });
      }
    }
  }

  const gotoPage = (page: number) => {
    changePage(page < pagination.value.current)
      .then((result) => JSON.parse(result))
      .then(analyze);
    pagination.value.current = Math.max(page, 0);
  };

  const init = () => {
    reset();
  };

  const reset = () => {
    compositing.value.inputs = [];
    compositing.value.compositing = false;
    candidates.value = [];
    pagination.value.current = 0;
    pagination.value.isLastPage = false;
    process("{space}");
  };

  const selectCandidate = async (candidate: string, candidateIndex: number) => {
    try {
      if (/[0-9a-z]{1}/i.test(candidate)) {
        await pipe("{space}", process, analyze);
      } else {
        await pipe(
          // @ts-ignore
          candidateIndex,
          selectCandidateOnCurrentPage,
          JSON.parse,
          analyze,
        );
      }
    } catch (e) {
      console.error(e);
      reset();
    }
  };

  const onKeyPress = (keycode: string) => {
    let command = keycode;
    if (keycode === "{BackSpace}") {
      // rime 处理最后一个 backspace 和 rawInput 的 backspace 时，不是我们想要的 state
      if (!compositing.value.compositing) {
        backspaceComposite(props.cursor);
        analyze({ state: 0, committed: "" });
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

  return {
    onKeyPress,
    selectCandidate,
    reset,
    init,
    gotoPage,
    setOption,

    pagination: computed(() => pagination.value),
    candidates: computed(() => candidates.value),
    preview: computed(() => compositing.value.inputs),
  };
};

const useHandwriteCompositor = (props: {
  queryCandidates: (image: string) => Promise<string[]>;
  value: Ref<string>;
  pad: Readonly<ShallowRef<Maybe<HandwritePad>>>;
  cursor: ReturnType<typeof useInputCursor>;
}) => {
  const candidates = ref<string[]>([]);

  const compositing = ref({
    compositing: false,
  });

  const onDebounceWrite = debounce(async (image: string) => {
    try {
      const result = await props.queryCandidates(image);
      if (Array.isArray(result)) {
        candidates.value = result;
      } else {
        candidates.value = [];
      }
    } catch (_) {
      candidates.value = [];
    }
  }, 1000);

  const selectCandidate = (candidate: string = "") => {
    console.log(candidate);
    candidates.value = [];
    const committed =
      props.cursor.prior.value + candidate + props.cursor.posterior.value;
    props.value.value = committed;
    props.pad.value?.clean();
    compositing.value.compositing = false;
  };

  const reset = () => {
    onDebounceWrite.cancel();
    candidates.value = [];
    props.pad.value?.clean();
    compositing.value.compositing = false;
  };

  const init = () => {
    reset();
  };

  const onKeyPress = async (keycode: string) => {
    if (compositing.value.compositing) {
      if (keycode === "{space}") {
        selectCandidate(candidates.value[0]);
      }
      if (keycode === "{BackSpace}") {
        selectCandidate();
      }
    }
  };

  return {
    onWrite: async (image: string) => {
      compositing.value.compositing = true;
      return onDebounceWrite(image);
    },
    init,
    reset,
    selectCandidate,
    onKeyPress,

    compositing: computed(() => compositing.value.compositing),
    pagination: computed<Pagination>(() => ({
      isLastPage: true,
      current: 0,
      totalPages: 0,
    })),
    candidates: computed(() => candidates.value),
  };
};

export const useCompositors = (props: {
  queryCandidates: (image: string) => Promise<string[]>;
  value: Ref<string>;
  pad: Readonly<ShallowRef<Maybe<HandwritePad>>>;
  cursor: ReturnType<typeof useInputCursor>;
  pageSize: number;
}) => {
  const mode = ref<ValueOf<typeof Compositors>>(0);

  const keyboardCompositor = useRimeCompositor(props);
  const handwritCompositor = useHandwriteCompositor(props);

  const onKeyPress = (keycode: string) => {
    if (handwritCompositor.compositing.value) {
      return handwritCompositor.onKeyPress(keycode);
    }

    return keyboardCompositor.onKeyPress(keycode);
  };

  return {
    mode,

    candidates: computed(() =>
      mode.value === Compositors.Handwrite
        ? handwritCompositor.candidates.value
        : keyboardCompositor.candidates.value,
    ),
    onKeyPress,
    gotoPage: (p: number) =>
      mode.value === Compositors.Handwrite ? p : keyboardCompositor.gotoPage,
    selectCandidate: (candidate: string, candidateIndex: number) =>
      mode.value === 1
        ? handwritCompositor.selectCandidate(candidate)
        : keyboardCompositor.selectCandidate(candidate, candidateIndex),
    init: () => {
      if (mode.value === Compositors.Handwrite) {
        handwritCompositor.init();
      } else {
        keyboardCompositor.init();
      }
    },
    resetAll: () => {
      handwritCompositor.reset();
      keyboardCompositor.reset();
    },
    // TODO: expand to all compositor
    pagination: computed(() => keyboardCompositor.pagination.value),

    handwritCompositor,
    keyboardCompositor,
  };
};
