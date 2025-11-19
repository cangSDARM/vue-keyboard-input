import { onBeforeUnmount, ref, shallowRef, watch, type Ref } from "vue";

const AlphabetRegex = /^[a-z]$/i;
const NumericRegex = /^[0-9]$/i;

export const useInputCursor = (props: { value: Ref<string> }) => {
  /** 输入保留的前缀 */
  const prior = ref('');
  /** 输入保留的后缀 */
  const posterior = ref('');
  const range = ref({ start: 0, end: 0 as Maybe<number> });
  const element = shallowRef<Maybe<HTMLInputElement>>();

  const onSelectionRangeChange = (value: string, start: Maybe<number>, end: Maybe<number>) => {
    range.value = { start: start ?? 0, end };
    prior.value = value.substring(0, start!);
    posterior.value = value.substring(end!);
  };

  const onSelectRange = () => {
    const target = element.value;
    onSelectionRangeChange(props.value.value, target?.selectionStart, target?.selectionEnd);
  };

  const cleanup = () => {
    element.value?.removeEventListener('select', onSelectRange); // drag & select
    element.value?.removeEventListener('keyup', onSelectRange); // click to some where
  };

  watch(
    element,
    (el) => {
      cleanup();
      el?.addEventListener('select', onSelectRange); // drag & select
      el?.addEventListener('pointerup', onSelectRange); // click to some where
      onSelectRange();
    },
    { flush: 'post' },
  );
  watch(props.value, onSelectRange, { immediate: true, flush: 'post' }); // value changed

  onBeforeUnmount(() => cleanup);

  return {
    element,
    range,
    prior,
    posterior,
  };
};

type KeyPressHandler = (e: Maybe<MouseEvent>, button: string) => void;
export const useKeyPress = () => {
  const keyMap = new Map<string, KeyPressHandler>();

  const bindKeyPress = (key: string, fn: KeyPressHandler) => {
    keyMap.set(key, fn);
  };

  const tryCall = (fn?: KeyPressHandler, ...args: Parameters<KeyPressHandler>) => {
    if (typeof fn === 'function') {
      fn(...args);
    }
  };

  return {
    onKeyPress: (button: string, e?: MouseEvent) => {
      e?.preventDefault();
      e?.stopImmediatePropagation();

      tryCall(keyMap.get('{__any__}'), e, button);
      if (AlphabetRegex.test(button)) {
        tryCall(keyMap.get('{alphabet}'), e, button);
      } else if (NumericRegex.test(button)) {
        tryCall(keyMap.get('{numeric}'), e, button);
      }

      tryCall(keyMap.get(button), e, button);
    },
    bindKeyPress,
  };
};

export const useShiftKeyboard = (getSelector: () => string) => {
  let shiftElement: HTMLElement | null = null;
  let focusedElement: HTMLInputElement | null = null;

  return {
    shift: (focusedEle: HTMLInputElement, { shiftAnchor = window.innerHeight / 2 } = {}) => {
      shiftElement = document.querySelector(getSelector());
      focusedElement = focusedEle;

      if (!shiftElement || !focusedElement) return;

      const focusRect = focusedElement.getBoundingClientRect();
      const shiftY = shiftAnchor - focusRect.top;

      const originalShiftY = getComputedStyle(shiftElement).transform;
      // cannot handle the shifted element
      if (originalShiftY !== 'none') return;

      if (shiftY > 0) return;

      shiftElement.style.transform = `translateY(${shiftY}px)`;
    },
    unshift: () => {
      if (shiftElement) {
        shiftElement.style.transform = '';
        shiftElement = null;
      }
      focusedElement = null;
    },
  };
};
