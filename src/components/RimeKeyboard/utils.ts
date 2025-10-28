const AlphabetRegex = /^[a-z]$/i;
const NumericRegex = /^[0-9]$/i;

type KeyPressHandler = (e: MayBe<MouseEvent>, button: string) => void;
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
