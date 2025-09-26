<script setup lang="js">
import {ref, defineProps, defineEmits, defineOptions, defineExpose, onMounted,watch, useTemplateRef, computed} from 'vue';
import Keyboard from 'simple-keyboard';
import 'simple-keyboard/build/css/index.css';
import KeyboardIcon from './keyboard.svg';
import Candidates from './Candidates.vue';
import { CapState, Layouts } from './constants';
import { useKeyPress, initDictionary } from './utils';

defineOptions({
  inheritAttrs: false,
});
const emits = defineEmits(['change', 'enter', 'close', 'focus']);
const props = defineProps({
  // default layout
  layoutName: {
    type: String,
    default: 'default',
  },
  // 保留几位小数 layoutName为number时生效
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
});

// input result
const rawInput = defineModel('default', { default: '' });

// translation
const t = a => a;
/** the simple-keyboard instance */
const keyboard = ref(null);
const compositorRef = useTemplateRef('compositor');
const language = ref('zh-cn');
const capState = ref(CapState.Off);
// internal visibility. define open or close
const visibility = ref(false);

const rootElementRef = useTemplateRef('keyboard-root');
const curInputElementRef = useTemplateRef('input');

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

const open = () => {
  if (visibility.value) return;

  visibility.value = true;
  compositorRef.value.update(rawInput.value, (v) => {
    rawInput.value = v;
  });
  keyboard.value.setCaretPosition(0);
};

const close = () => {
  if (!visibility.value) return;
  if (props.layoutName == 'number') {
    // 处理精度
    rawInput.value = rawInput.value
      ?.replace(new RegExp(`(\\d+)\\.(\\d{${props.precision}}).*$`), '$1.$2')
      .replace(/\.$/, '');
  }

  visibility.value = false;
  emits('close');
};

const { onKeyPress, bindKeyPress } = useKeyPress();

const keyboardInit = () => {
  if (keyboard.value) return;

  keyboard.value = new Keyboard('simple-keyboard', {
    onChange: onChange,
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
  });
};

const onChange = (input, e) => {
  e.preventDefault();
  e.stopImmediatePropagation();

  rawInput.value = input;

  if (language.value === 'zh-cn') {
    compositorRef.value.update(input, (v) => {
      rawInput.value = v;
    });
  }
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

  const shiftLayout = capState.value === CapState.Off ? 'default' : 'shift';
  keyboard.value.setOptions({
    layoutName: shiftLayout,
  });
};

const handleLang = () => {
  // 切换中英文输入法
  if (language.value === 'en') {
    language.value = 'zh-cn';
  } else {
    language.value = 'en';
    compositorRef.value.reset();
  }

  const options = getDisplayOptions();

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
  emits('enter');
  close();
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
  compositorRef.value.reset();
  keyboard.value.setOptions({
    layoutName: 'symbols',
  });
});
bindKeyPress('{arrowleft}', () => handleArrow(0));
bindKeyPress('{arrowright}', () => handleArrow(1));

const handlePopClose = (e) => {
  // 空白区域
  if (e.target === rootElementRef.value && props.hideOnBlur) {
    close();
  } else {
    if (document.activeElement !== curInputElementRef.value) {
      curInputElementRef.value.focus();
    }
  }
};

// sync visibility
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
// sync input to simple-keyboard
watch(rawInput, (nv) => {
  emits('change');
  if (keyboard.value.getInput() !== nv) {
    keyboard.value.setInput(rawInput.value);
  }
});

onMounted(() => {
  initDictionary();
  keyboardInit();
});

defineExpose({ open, close });
</script>

<template>
  <Teleport to="body">
    <div
      class="simple-keyboard-wrapper"
      ref="keyboard-root"
      v-show="visible"
      @click="handlePopClose"
    >
      <!-- v-if make it focus when open -->
      <v-text-field
        v-if="visible"
        class="input-field"
        ref="input"
        clearable
        label="Label"
        autofocus
        v-model="rawInput"
        @click:clear="handleClear"
        hide-details
      />

      <div class="keyboard-ui">
        <Candidates ref="compositor" />
        <div class="simple-keyboard"></div>
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss">
.simple-keyboard-wrapper {
  z-index: 9999;
  background: rgba(var(--v-theme-on-surface), 0.25);

  position: fixed;
  inset: 0;
  max-width: 100vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  padding: 0 2px;

  font-size: 1.25rem;

  > .input-field {
    width: 20em;
    max-width: 50vw;
    flex-grow: 0;
    transform: translateY(-100%);
    background: rgba(var(--v-theme-surface), 1);
    color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity));
  }

  > .keyboard-ui {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
  }

  .simple-keyboard {
    font-family: Menlo, Monaco, Consolas, "Courier New", monospace;
    color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity));

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
