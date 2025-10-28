<script setup lang="ts">
import Keyboard from "simple-keyboard";
import "simple-keyboard/build/css/index.css";
import { useI18n } from "vue-i18n";
import Candidates from "./Candidates.vue";
import {
  CapState,
  KeyboardFocusQuery,
  KeyboardTypes,
  KeysSimpleToRime,
  Languages,
  Layouts,
} from "./constants";
import KeyboardIcon from "./keyboard.svg";
import { useKeyPress, useShiftKeyboard } from "./utils";
import {
  defineOptions,
  withDefaults,
  defineProps,
  computed,
  onMounted,
  ref,
  useTemplateRef,
  watch,
  defineEmits,
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
    /** 保留几位小数 layoutName为numbers时生效 */
    precision?: number;
    hideOnBlur?: boolean;
    disabled?: boolean;
    /** input框 */
    inputElement?: HTMLInputElement;
    /** 应用偏移效果的元素 */
    shiftElement: string;
    /** 键盘类型：shifted、float */
    type?: ValueOf<typeof KeyboardTypes>;
  }>(),
  {
    layoutName: "default",
    language: Languages.zhCN,
    precision: 2,
    type: KeyboardTypes.Float,
  }
);
const emits = defineEmits<{
  close: [type?: string];
  change: [];
  enter: [];
  focus: [];
}>();

const rawInput = defineModel("default", { default: "" });

const { t } = useI18n();
const { onKeyPress, bindKeyPress } = useKeyPress();
const { shift, unshift } = useShiftKeyboard(() => props.shiftElement);

const keyboard = ref<Keyboard>(null!);
const compositorRef = useTemplateRef("compositor");
const language = ref<ValueOf<typeof Languages>>(props.language);
const capState = ref<ValueOf<typeof CapState>>(CapState.Off);
const visibility = ref(false);

const overlayElementRef = useTemplateRef("keyboard-overlay");
const curInputElement = useTemplateRef("input-el");

const symbolI6n = computed(() => t("keyboard.keys.symbol"));
const spaceI6n = computed(() => t("keyboard.keys.space"));

const getDisplayOptions = () => {
  return {
    "{num}": "123",
    "{abc}": "ABC",
    "{symbol}": symbolI6n.value,
    "{bksp}": "⌫",
    "{NONE}": " ",
    "{caps}": "caps",
    "{enter}": "⏎",
    "{lang}": t(`keyboard.keys.${language.value}`),
    "{space}": spaceI6n.value,
    "{close}": `<img src=${KeyboardIcon} /><span>🞃</span>`,
    "{arrowleft}": "←",
    "{arrowright}": "→",
  };
};

/** 当 input 不再是 keyboard 的目标元素时处理
 */
const handleInputUntargeted = (e: { target: MayBe<HTMLElement> }) => {
  delete e.target?.dataset[KeyboardFocusQuery];
  e.target?.dispatchEvent(
    new CustomEvent("keyboard-send-to-screen", { bubbles: true })
  );
  e.target?.removeEventListener("blur", handleInputUntargeted as any);
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

  compositorRef.value!.init(rawInput.value);
  keyboard.value!.setCaretPosition(rawInput.value.length);

  /// must set a timeout, otherwise it will interference the keyboard showup
  setTimeout(() => {
    document.addEventListener("click", handlePopClick);
  }, 100);
};

const close = (type?: string) => {
  if (props.layoutName == "numbers") {
    // 处理精度
    rawInput.value = rawInput.value
      ?.replace(new RegExp(`(\\d+)\\.(\\d{${props.precision}}).*$`), "$1.$2")
      .replace(/\.$/, "");
  }

  handleInputUntargeted({ target: props.inputElement });
  visibility.value = false;
  unshift();
  compositorRef.value!.reset();
  emits("close", type);
  document.removeEventListener("click", handlePopClick);
};

const keyboardInit = () => {
  if (keyboard.value) return;

  keyboard.value = new Keyboard("simple-keyboard", {
    onKeyPress: onKeyPress,
    layout: Layouts as any,
    layoutName: props.layoutName,
    display: getDisplayOptions(),
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
  keyboard.value.setOptions({
    layoutName: shiftLayout,
  });
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

  const options = getDisplayOptions();
  compositorRef.value!.setOption("ascii_mode", language.value === Languages.en);

  keyboard.value.setOptions({
    display: options,
  });
};

const handleClear = () => {
  keyboard.value.clearInput();
  compositorRef.value!.reset();
  rawInput.value = "";
};

const handleEnter = () => {
  compositorRef.value!.onKeyPress("{space}")?.then(() => {
    emits("enter");
    close();
  });
};

const handleArrow = (num: number) => {
  // 处理左右箭头下标位置
  const index = keyboard.value.getCaretPositionEnd()!;
  if (num == 0 && index - 1 >= 0) {
    keyboard.value.setCaretPosition(index - 1);
  } else if (num == 1 && index + 1 <= (rawInput.value?.length || 0)) {
    keyboard.value.setCaretPosition(index + 1);
  }
};
bindKeyPress("{__any__}", (_: any, button: string) => {
  if (KeysSimpleToRime.Escaped.includes(button)) return;
  // @ts-ignore
  if (KeysSimpleToRime.Replaced[button]) {
    // @ts-ignore
    compositorRef.value?.onKeyPress(KeysSimpleToRime.Replaced[button]);
  } else if (KeysSimpleToRime.AsSpaced.includes(button)) {
    compositorRef.value?.onKeyPress(KeysSimpleToRime.Replaced["{space}"]);
  } else {
    compositorRef.value?.onKeyPress(button);
  }
});
bindKeyPress("{caps}", handleLock);
bindKeyPress(
  "{lang}",
  handleLang as unknown as (lang: MayBe<MouseEvent>) => void
);
bindKeyPress("{clear}", handleClear);
bindKeyPress("{enter}", handleEnter);
bindKeyPress("{close}", close as unknown as () => void);
bindKeyPress("{num}", () => {
  compositorRef.value?.reset();
  compositorRef.value?.setOption("ascii_mode", true);
  keyboard.value.setOptions({
    layoutName: "numbers",
  });
});
bindKeyPress("{abc}", () => {
  keyboard.value.setOptions({
    layoutName: "default",
  });
});
bindKeyPress("{symbol}", () => {
  keyboard.value.setOptions({
    layoutName: "symbols",
  });
});
bindKeyPress("{arrowleft}", () => handleArrow(0));
bindKeyPress("{arrowright}", () => handleArrow(1));

const handlePopClick = (e: MouseEvent) => {
  switch (props.type) {
    case KeyboardTypes.Float:
      // 空白区域
      if (e.target === overlayElementRef.value && props.hideOnBlur) {
        close("blur");
      }
      break;
    case KeyboardTypes.Shifted: {
      const elements = document.elementsFromPoint(e.clientX, e.clientY);
      const newInputElement = elements.find(
        (element) => element instanceof HTMLInputElement
      );
      if (!newInputElement) {
        if (!elements.includes(keyboard.value!.keyboardDOM.parentElement!)) {
          close("blur");
        }
        return;
      }
      break;
    }
  }
};

watch(
  () => props.inputElement,
  (element) => {
    if (props.type === KeyboardTypes.Shifted) {
      element?.addEventListener("blur", handleInputUntargeted as any);
    }
    if (element) {
      open();
    } else {
      close();
    }
  }
);
watch(
  () => props.layoutName,
  (layout) => {
    if (layout !== "default") {
      compositorRef.value?.setOption("ascii_mode", true);
    }
    if (keyboard.value) {
      keyboard.value.setOptions({
        layoutName: layout,
      });
    }
  }
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
      }"
      v-show="visibility"
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
      <Candidates ref="compositor" v-model="rawInput" />
      <div class="simple-keyboard"></div>
    </div>
  </Teleport>
</template>

<style lang="scss">
.rime-keyboard-wrapper {
  color: black;
  $keyboard-z-index: 9999;
  z-index: $keyboard-z-index;

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
    .hg-button {
      &-num,
      &-symbol,
      &-abc {
        cursor: default;
        pointer-events: none;
        color: rgba(var(--v-theme-on-surface), 0.25);
      }
    }
  }

  .simple-keyboard {
    font-family: SourceHanSans, Ariral, Plangothic;
    background-color: var(--keyboard-bg, #ececec);
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
      background: var(--keyboard-button-bg, #fff);

      /** 控制按钮 */
      &-num,
      &-symbol,
      &-caps,
      &-lang,
      &-tab {
        width: 4em;
        flex: 0 1 auto;
      }
      &-enter {
        width: 6em;
        flex: 0 1 auto;
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
      .hg-row {
        > :last-child {
          width: 10em;
          flex-grow: 0;
        }
      }
    }
  }
}
</style>
