<script setup lang="ts">
import Return from "@/assets/cancel.svg?raw";
import Bksp from "@/assets/keyboard-bksp.svg?raw";
import Right from "@/assets/right.svg?raw";
import Keyboard from "simple-keyboard";
import "simple-keyboard/build/css/index.css";
import { useI18n } from "vue-i18n";
import Candidates from "./Candidates.vue";
import { Compositors, useCompositors } from "./compositor";
import {
  CapState,
  KeyboardFocusQuery,
  KeyboardTypes,
  KeysSimpleToRime,
  Languages,
  Layouts,
} from "./constants";
import HandwritePad from "./HandwritePad.vue";
import KeyboardIcon from "./keyboard.svg";
import { useInputCursor, useKeyPress, useShiftKeyboard } from "./utils";
import {
  computed,
  nextTick,
  onMounted,
  ref,
  shallowRef,
  useTemplateRef,
  watch,
} from "vue";

defineOptions({
  inheritAttrs: false,
});
const props = withDefaults(
  defineProps<{
    layoutName?: keyof typeof Layouts;
    language?: ValueOf<typeof Languages>;
    /** 是否锁定布局 */
    isLockLayout?: boolean;
    hideOnBlur?: boolean;
    disabled?: boolean;
    /** input框 */
    inputElement?: HTMLInputElement;
    /** 应用偏移效果的元素 */
    shiftElement: string;
    /** 键盘类型：shifted、float */
    type?: ValueOf<typeof KeyboardTypes>;
    /** 手写识别 */
    onHandwriteRecognition?: (image: string) => Promise<string[]>;
  }>(),
  {
    layoutName: "default",
    language: Languages.zhCN,
    precision: 2,
    type: KeyboardTypes.Float,
    onHandwriteRecognition: async () => [] as string[],
  },
);
const emits = defineEmits<{
  close: [type?: string];
  change: [];
  enter: [];
  focus: [];
}>();

const rawInput = defineModel("default", { default: "" });

const { t } = useI18n();
const { onKeyPress, onKeyReleased, bindKeyPress } = useKeyPress();
const { shift, unshift } = useShiftKeyboard(() => props.shiftElement || "#app");

const keyboard = shallowRef<Keyboard>(null!);
const language = ref<ValueOf<typeof Languages>>(props.language);
const capState = ref<ValueOf<typeof CapState>>(CapState.Off);
const visibility = ref(false);

const overlayElementRef = useTemplateRef("keyboard-overlay");
const curInputElement = useTemplateRef("input-el");

const cursor = useInputCursor({
  value: rawInput,
});
const compositor = useCompositors({
  pageSize: 10,
  value: rawInput,
  cursor,
  queryCandidates: props.onHandwriteRecognition,
  pad: useTemplateRef("handwrite-pad"),
});

const symbolI6n = computed(() => t("keyboard.keys.symbol"));
const spaceI6n = computed(() => t("keyboard.keys.space"));
const handwritingI6n = computed(() => t("keyboard.keys.handwriting"));
const abcdI6n = computed(() => t("keyboard.keys.handwritingReturn"));

const getDisplayOptions = () => {
  return {
    "{num}": "123",
    "{abcd}": abcdI6n.value,
    "{abc}": Return,
    "{symbol}": symbolI6n.value,
    "{bksp}": Bksp,
    "{NONE}": " ",
    "{handwriting}": handwritingI6n.value,
    "{caps}": 'A<span style="color: #CC3300">a</span>',
    "{enter}": Right,
    "{lang}": t(`keyboard.keys.${language.value}`),
    "{space}": spaceI6n.value,
    "{close}": `<img src=${KeyboardIcon} /><span>🞃</span>`,
    "{arrowleft}": "←",
    "{arrowright}": "→",
  };
};

/** 当 input 不再是 keyboard 的目标元素时处理
 */
const handleInputUntargeted = (e: { target: Maybe<HTMLElement> }) => {
  delete e.target?.dataset[KeyboardFocusQuery];
  e.target?.dispatchEvent(
    new CustomEvent("keyboard-send-to-screen", { bubbles: true }),
  );
};

const open = () => {
  visibility.value = true;
  props.inputElement!.dataset[KeyboardFocusQuery] = "true";

  switch (props.type) {
    case KeyboardTypes.Float:
      curInputElement.value!.focus();
      break;
    case KeyboardTypes.Shifted:
      shift(props.inputElement!, {
        shiftAnchor: window.innerHeight / 2 - 50,
      });
      break;
    default:
      console.warn("Unknown keyboard type! ", props.type);
  }

  compositor.init();

  /// must set a timeout, otherwise it will interference the keyboard showup
  setTimeout(() => {
    document.addEventListener("pointerdown", handlePopClick);
  }, 100);
};

const close = (type?: string) => {
  handleInputUntargeted({ target: props.inputElement });
  document.removeEventListener("pointerdown", handlePopClick);
  unshift();
  changeLayout("default");
  compositor.resetAll();
  emits("close", type);
  visibility.value = false;
};

const keyboardInit = () => {
  if (keyboard.value) return;

  keyboard.value = new Keyboard("simple-keyboard", {
    onKeyPress,
    onKeyReleased,
    layout: Layouts as any,
    layoutName: props.layoutName,
    display: getDisplayOptions(),
    physicalKeyboardHighlight: true,
    buttonTheme: [
      {
        class: "hg-highlight",
        buttons: "Q q",
      },
    ],
    // theme: 'hg-theme-default init-keyboard' // 添加自定义class处理清空逻辑
  });
};

const handleLock = () => {
  switch (capState.value) {
    case CapState.Off:
      capState.value = CapState.Always;
      break;
    case CapState.Always:
      capState.value = CapState.Off;
      break;
  }

  const shiftLayout = capState.value === CapState.Off ? "default" : "shift";
  changeLayout(shiftLayout);
};

const handleLang = (lang: MouseEvent | string) => {
  if (typeof lang === "string") {
    language.value = lang as any;
  } else {
    // 切换中英文输入法
    if (language.value === Languages.en) {
      language.value = Languages.zhCN;
    } else {
      language.value = Languages.en;
    }
  }

  compositor.keyboardCompositor.setOption(
    "ascii_mode",
    language.value === Languages.en,
  );
  keyboard.value.setOptions({
    display: getDisplayOptions(),
  });
};

const handleClear = () => {
  keyboard.value.clearInput();
  compositor.resetAll();
  rawInput.value = "";
};

const handleEnter = () => {
  compositor.onKeyPress("{space}")?.then(() => {
    nextTick(() => {
      emits("enter");
      close();
    });
  });
};

const changeLayout = (name: keyof typeof Layouts) => {
  // 对于锁定布局的，直接当作“完成输入操作”
  if (props.isLockLayout && props.layoutName !== name) {
    return handleEnter();
  }

  compositor.resetAll();
  if (name === "default") {
    handleLang(language.value);
  } else {
    compositor.keyboardCompositor.setOption("ascii_mode", true);
  }

  if (name === "handwrite") {
    compositor.mode.value = Compositors.Handwrite;
  } else {
    compositor.mode.value = Compositors.Keyboard;
  }

  compositor.init();
  keyboard.value.setOptions({
    layoutName: name,
    display: getDisplayOptions(),
  });
};

const handleArrow = (num: number) => {
  // 处理左右箭头下标位置
  const index = cursor.range.value.end!;
  if (num == 0 && index - 1 >= 0) {
    cursor.range.value.start = index - 1;
    keyboard.value.setCaretPosition(index - 1);
  } else if (num == 1 && index + 1 <= (rawInput.value?.length || 0)) {
    cursor.range.value.start = index + 1;
    keyboard.value.setCaretPosition(index + 1);
  }
};
bindKeyPress(
  "{__any__}",
  (_: any, button: string) => {
    if (!visibility.value) return;
    if (KeysSimpleToRime.Escaped.includes(button)) return;
    // @ts-ignore
    if (KeysSimpleToRime.Replaced[button]) {
      // @ts-ignore
      compositor.onKeyPress(KeysSimpleToRime.Replaced[button]);
    } else if (KeysSimpleToRime.AsSpaced.includes(button)) {
      compositor.onKeyPress(KeysSimpleToRime.Replaced["{space}"]);
    } else {
      compositor.onKeyPress(button);
    }
  },
  { activate: "down" },
);
bindKeyPress("{caps}", handleLock);
bindKeyPress("{lang}", handleLang as unknown as (e: Maybe<MouseEvent>) => void);
bindKeyPress("{clear}", handleClear);
bindKeyPress("{enter}", handleEnter);
bindKeyPress("{close}", close as unknown as () => void);
bindKeyPress("{num}", () => changeLayout("numbers"));
bindKeyPress("{handwriting}", () => changeLayout("handwrite"));
bindKeyPress("{abc}", () => changeLayout("default"));
bindKeyPress("{abcd}", () => changeLayout("default"));
bindKeyPress("{symbol}", () => changeLayout("symbols"));
bindKeyPress("{arrowleft}", () => handleArrow(0));
bindKeyPress("{arrowright}", () => handleArrow(1));

const handlePopClick = (e: PointerEvent) => {
  switch (props.type) {
    case KeyboardTypes.Float:
      // 空白区域
      if (e.target === overlayElementRef.value && props.hideOnBlur) {
        handleEnter();
      }
      break;
    case KeyboardTypes.Shifted: {
      const elements = document.elementsFromPoint(e.clientX, e.clientY);
      const newInputElement = elements.find(
        (element) => element instanceof HTMLInputElement,
      );
      if (!newInputElement) {
        if (!elements.includes(keyboard.value!.keyboardDOM.parentElement!)) {
          handleEnter();
        }
        return;
      }
      break;
    }
  }
};

watch(
  () => props.inputElement,
  (element, oldElement) => {
    cursor.element.value = element;
    if (props.type === KeyboardTypes.Shifted) {
      // 两个 input 间切换。需要给旧的发送一下指令
      if (element && oldElement) {
        handleInputUntargeted({ target: oldElement });
      }
    }
    if (element) {
      open();
    } else {
      close();
    }
  },
);
watch(
  () => props.layoutName,
  (layout) => {
    if (keyboard.value) {
      changeLayout(layout);
    }
  },
);
watch(() => props.language, handleLang);
watch(rawInput, (nv) => {
  emits("change");
  if (keyboard.value.getInput() !== nv) {
    keyboard.value.setInput(rawInput.value);
  }
});

onMounted(() => {
  keyboardInit();
});
</script>

<template>
  <Teleport to="body">
    <div
      :class="['rime-keyboard-wrapper', isLockLayout && 'locked-layout']"
      :style="{
        background:
          type === KeyboardTypes.Shifted
            ? 'transparent'
            : 'rgba(var(--v-theme-on-surface), 0.25)',
        contentVisibility: visibility ? 'visible' : 'hidden',
      }"
    >
      <input
        ref="input-el"
        clearable
        label=""
        v-model="rawInput"
        @click:clear="handleClear"
        hide-details
        :style="{
          visibility: type === KeyboardTypes.Shifted ? 'hidden' : 'visible',
        }"
      />
      <section
        ref="keyboard-overlay"
        v-if="type === KeyboardTypes.Float"
      ></section>
      <HandwritePad
        v-if="compositor.mode.value === Compositors.Handwrite"
        @write="compositor.handwritCompositor.onWrite"
        to=".simple-keyboard .hg-rows"
        ref="handwrite-pad"
      />
      <Candidates
        :preview="compositor.keyboardCompositor.preview.value"
        :candidates="compositor.candidates.value"
        :goto-page="compositor.gotoPage"
        :pagination="compositor.pagination.value"
        :select-candidate="compositor.selectCandidate"
      />
      <div class="simple-keyboard"></div>
    </div>
  </Teleport>
</template>

<style lang="scss">
.rime-keyboard-wrapper {
  $keyboard-z-index: 9999;
  z-index: $keyboard-z-index;

  will-change: auto;
  position: fixed;
  bottom: 0;
  right: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  padding: 0 2px;

  font-size: 1.25rem;

  > input {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -150%);
    z-index: calc($keyboard-z-index + 2);

    width: 20em;
    max-width: 50vw;
    background: rgba(var(--v-theme-surface), 1);
  }

  > section {
    position: fixed;
    inset: 0;
    z-index: calc($keyboard-z-index + 1);
  }

  &.locked-layout {
  }

  .simple-keyboard {
    font-family: Ariral, SourceHanSans, Plangothic;
    background-color: #ececec;
    z-index: calc($keyboard-z-index + 2);

    /** 高度 */
    height: 42vh;
    .hg-rows {
      display: flex;
      height: 100%;
      flex-direction: column;
    }
    .hg-row {
      flex: 1;
    }

    .hg-button {
      height: unset;
      background: #fff;
      border-color: #b5b5b5;

      &:hover {
        filter: brightness(0.95);
      }
      &.hg-activeButton {
        filter: brightness(0.9);
      }

      @mixin inline-svg($w, $h) {
        svg {
          --svg-black: rgb(var(--v-theme-on-surface-variant));
          --svg-white: rgb(var(--v-theme-on-surface-variant));
          width: $w;
          height: $h;
        }
      }

      /** 控制按钮 */
      &-caps {
        width: 20px;
      }
      &-bksp {
        width: 6em;
        @include inline-svg(22px, 14px);
      }
      &-num,
      &-handwriting,
      &-symbol,
      &-lang,
      &-tab {
        width: 6em;
        flex: 0 1 auto;
      }
      &-abc,
      &-abcd {
        width: 6em;
        flex: 0 1 auto;
        svg {
          padding-top: 0.25em;
        }
        @include inline-svg(22px, 25px);
      }
      &-enter {
        width: 6em;
        flex: 0 1 auto;
        @include inline-svg(18px, 12px);
      }
      /** 占位符 */
      &-NONE {
        width: 2em;
        flex-grow: 0;
        visibility: hidden;
      }
    }

    &.hg-layout-default {
      .hg-button.hg-highlight {
        z-index: 1;
      }
    }

    /** 数字键盘 */
    &.hg-layout-numbers {
      .hg-row {
        > :first-child,
        > :last-child {
          width: 12em;
          flex-grow: 0;
        }
      }
    }

    /** 符号键盘 */
    &.hg-layout-symbols {
      [data-skbtn="@"] {
        max-width: unset !important;
      }
      .hg-button {
        &-bksp {
          flex: 0 1 auto;
        }
      }
    }

    &.hg-layout-handwrite {
      .hg-rows {
        position: relative;
        /** pad */
        .z-handwrite-pad-wrapper {
          position: absolute;
          padding-right: calc(6em + 5px);
          padding-bottom: 5px;
          z-index: 1;
        }

        .hg-row:nth-last-child(2) {
          margin-bottom: 0;
          z-index: 2;
        }
        .hg-row:not(:nth-last-child(1)):not(:nth-last-child(2)) {
          width: 6em;
          margin-left: auto;
          z-index: 2;
        }
      }
    }
  }
}
</style>
