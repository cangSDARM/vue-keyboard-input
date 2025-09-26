<script setup lang="js">
import Keyboard from 'simple-keyboard';
import 'simple-keyboard/build/css/index.css';
import KeyboardIcon from './keyboard.svg';
import { useI18n } from 'vue-i18n';
import Candidates from './Candidates.vue';
import { CapState, Layouts, Languages, KeyboardTypes } from './constants';
import { useKeyPress, useShiftKeyboard } from './utils';
import { defineOptions, defineProps, ref, shallowRef, defineExpose, defineModel, watch, useTemplateRef, computed, onMounted } from 'vue';

const keyboardFocusQuery = 'keyboardFocused';

defineOptions({
  inheritAttrs: false,
});
const emits = defineEmits(['change', 'enter', 'close', 'focus']);
const props = defineProps({
  layoutName: {
    type: String,
    default: 'default',
  },
  language: {
    type: String,
    default: Languages.zhCN,
  },
  // 是否锁定布局
  isLockLayout: {
    type: Boolean,
    default: false,
  },
  // 保留几位小数 layoutName为numbers时生效
  precision: {
    type: Number,
    default: 2,
  },
  hideOnBlur: {
    type: Boolean,
  },
  visible: {
    type: Boolean,
    default: false,
  },
  disabled: Boolean,
  /** input框 */
  inputElement: HTMLInputElement,
  /** 应用偏移效果的元素 */
  shiftElement: String,
  /** 键盘类型：shifted、float */
  type: {
    type: String,
    default: KeyboardTypes.Float,
  },
});

const rawInput = defineModel('default', { default: '' });

const { t } = useI18n();
const keyboard = ref(null);
const compositorRef = useTemplateRef('compositor');
const language = ref(props.language);
const capState = ref(CapState.Off);
const visibility = ref(false);

const { shift, unshift } = useShiftKeyboard(props.shiftElement, {
  sendToScreenEvent: 'keyboard-send-to-screen',
});

const overlayElementRef = useTemplateRef('keyboard-overlay');
const curInputElement = useTemplateRef('input-el');

const symbolI6n = computed(() => t('keyboard.keys.symbol'));
const spaceI6n = computed(() => t('keyboard.keys.space'));

const getDisplayOptions = () => {
  return {
    '{num}': '123',
    '{abc}': 'ABC',
    '{symbol}': symbolI6n.value,
    '{bksp}': '⌫',
    '{NONE}': ' ',
    '{caps}': 'caps',
    '{enter}': '⏎',
    '{lang}': t(`keyboard.keys.${language.value}`),
    '{space}': spaceI6n.value,
    '{close}': `<img src=${KeyboardIcon} /><span>🞃</span>`,
    '{arrowleft}': '←',
    '{arrowright}': '→',
  };
};

/** 当 input 不再是 keyboard 的目标元素时处理
 *
 * @param {{target: HTMLInputElement}} e
 */
const handleInputUntargeted = (e) => {
  delete e.target?.dataset[keyboardFocusQuery];
  e.target?.dispatchEvent(new CustomEvent('keyboard-send-to-screen', { bubbles: true }));
  e.target?.removeEventListener('blur', handleInputUntargeted);
};

const open = () => {
  visibility.value = true;
  props.inputElement.dataset[keyboardFocusQuery] = true;

  switch (props.type) {
    case KeyboardTypes.Float:
      curInputElement.value.focus();
      break;
    case KeyboardTypes.Shifted:
      shift(props.inputElement, {
        shiftAnchor: window.innerHeight / 2 - 50,
      });
      break;
    default:
      console.warn('Unknown keyboard type! ', props.type);
  }

  compositorRef.value.init(rawInput.value);
  keyboard.value.setCaretPosition(rawInput.value.length);

  /// must set a timeout, otherwise it will interference the keyboard showup
  setTimeout(() => {
    document.addEventListener('click', handlePopClick);
  }, 100);
};

const close = (type) => {
  if (props.layoutName == 'number') {
    // 处理精度
    rawInput.value = rawInput.value
      ?.replace(new RegExp(`(\\d+)\\.(\\d{${props.precision}}).*$`), '$1.$2')
      .replace(/\.$/, '');
  }

  handleInputUntargeted({ target: props.inputElement });
  visibility.value = false;
  unshift();
  compositorRef.value.reset();
  emits('close', type);
  document.removeEventListener('click', handlePopClick);
};

const keyboardInit = () => {
  if (keyboard.value) return;

  keyboard.value = new Keyboard('simple-keyboard', {
    onKeyPress: onKeyPress,
    layout: Layouts,
    layoutName: props.layoutName,
    display: getDisplayOptions(),
    buttonTheme: [
      {
        class: 'hg-highlight',
        buttons: 'Q q',
      },
    ],
    // theme: 'hg-theme-default init-keyboard' // 添加自定义class处理清空逻辑
  });
};

const { onKeyPress, bindKeyPress } = useKeyPress();

const handleLock = () => {
  switch (capState.value) {
    case CapState.Off:
      capState.value = CapState.Always;
      break;
    case CapState.Always:
      capState.value = CapState.Off;
      break;
  }

  const shiftLayout = capState.value === CapState.Off ? 'default' : 'shift';
  keyboard.value.setOptions({
    layoutName: shiftLayout,
  });
};

/** @param {MouseEvent | string} lang */
const handleLang = (lang) => {
  if (typeof lang === 'string') {
    language.value = lang;
  } else {
    // 切换中英文输入法
    if (language.value === Languages.en) {
      language.value = Languages.zhCN;
    } else {
      language.value = Languages.en;
    }
  }

  const options = getDisplayOptions();
  compositorRef.value.setOption('ascii_mode', language.value === Languages.en);

  keyboard.value.setOptions({
    display: options,
  });
};

const handleClear = () => {
  keyboard.value.clearInput();
  compositorRef.value.reset();
  rawInput.value = '';
};

const handleEnter = () => {
  compositorRef.value.onKeyPress('{space}').then(() => {
    emits('enter');
    close();
  });
};

const handleArrow = (num) => {
  // 处理左右箭头下标位置
  const index = keyboard.value.getCaretPositionEnd();
  if (num == 0 && index - 1 >= 0) {
    keyboard.value.setCaretPosition(index - 1);
  } else if (num == 1 && index + 1 <= (rawInput.value?.length || 0)) {
    keyboard.value.setCaretPosition(index + 1);
  }
};
bindKeyPress('{__any__}', (_, button) => {
  const Replaced = {
    '{bksp}': '{BackSpace}',
    '{space}': '{space}', // 上屏
    '{arrowleft}': '{Left}',
    '{arrowright}': '{Right}',
  };
  const Escaped = ['{enter}', '{close}'];
  const AsSpaced = ['{lang}', '{caps}', '{clear}', '{symbol}', '{abc}'];

  if (Escaped.includes(button)) return;
  if (Replaced[button]) {
    compositorRef.value.onKeyPress(Replaced[button]);
  } else if (AsSpaced.includes(button)) {
    compositorRef.value.onKeyPress(Replaced['{space}']);
  } else {
    compositorRef.value.onKeyPress(button);
  }
});
bindKeyPress('{caps}', handleLock);
bindKeyPress('{lang}', handleLang);
bindKeyPress('{clear}', handleClear);
bindKeyPress('{enter}', handleEnter);
bindKeyPress('{close}', close);
bindKeyPress('{num}', () => {
  compositorRef.value.reset();
  keyboard.value.setOptions({
    layoutName: 'numbers',
  });
});
bindKeyPress('{abc}', () => {
  keyboard.value.setOptions({
    layoutName: 'default',
  });
});
bindKeyPress('{symbol}', () => {
  keyboard.value.setOptions({
    layoutName: 'symbols',
  });
});
bindKeyPress('{arrowleft}', () => handleArrow(0));
bindKeyPress('{arrowright}', () => handleArrow(1));

/** @param {MouseEvent} e */
const handlePopClick = (e) => {
  switch (props.type) {
    case KeyboardTypes.Float:
      // 空白区域
      if (e.target === overlayElementRef.value && props.hideOnBlur) {
        close('blur');
      }
      break;
    case KeyboardTypes.Shifted: {
      const elements = document.elementsFromPoint(e.clientX, e.clientY);
      const newInputElement = elements.find((element) => element instanceof HTMLInputElement);
      if (!newInputElement) {
        if (!elements.includes(keyboard.value.keyboardDOM.parentElement)) {
          close('blur');
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
      element?.addEventListener('blur', handleInputUntargeted);
    }
  },
);
watch(
  () => props.layoutName,
  (layout) => {
    if (keyboard.value) {
      keyboard.value.setOptions({
        layoutName: layout,
      });
    }
  },
);
watch(() => props.language, handleLang);
watch(
  () => props.visible,
  (nv) => {
    if (nv) {
      open();
    } else {
      close();
    }
  },
);
watch(rawInput, (nv) => {
  emits('change');
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
      v-show="visible"
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
    font-family: Menlo, Monaco, Consolas, "Courier New", monospace;
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
