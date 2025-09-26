const AlphabetRegex = /^[a-z]$/i;
const NumericRegex = /^[0-9]$/i;

export const useKeyPress = () => {
  const keyMap = new Map();

  /**
   * @param {(e: MouseEvent, button: string) => void} fn
   */
  const bindKeyPress = (key, fn) => {
    keyMap.set(key, fn);
  };

  const tryCall = (fn, ...args) => {
    if (typeof fn === 'function') {
      fn(...args);
    }
  };

  return {
    onKeyPress: (button, e) => {
      e.preventDefault();
      e.stopImmediatePropagation();

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

export const useShiftKeyboard = (shiftElementSelector) => {
  /** @type {HTMLElement} */
  let shiftElement = null;
  /** @type {HTMLInputElement} */
  let focusedElement = null;

  return {
    shift: (focusedEle, { shiftAnchor = window.innerHeight / 2 } = {}) => {
      shiftElement = document.querySelector(shiftElementSelector);
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
        shiftElement.style.transform = null;
        shiftElement = null;
      }
      focusedElement = null;
    },
  };
};
