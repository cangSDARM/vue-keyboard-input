import { ref, shallowRef } from "vue";

const store = (function () {
  let element: HTMLInputElement | null = null;

  const visible = ref(false);
  const value = ref("");
  const options = shallowRef<Record<string, any>>({});
  const shiftElement = ref("#app");

  const syncInput = () => {
    if (element) {
      element.value = value.value;
      element.dispatchEvent(new Event("input", { bubbles: true }));
    }
  };

  const close = (ele?: Maybe<HTMLInputElement>) => {
    if (ele && ele !== element) return;
    // only write state if the input want to close.
    // else we don't emit anything, since we already done in keyboard
    if (ele)
      ele.dispatchEvent(
        new Event("keyboard-send-to-screen", { bubbles: true }),
      );

    visible.value = false;
    element?.blur(); // make it blur
    element = null;
    value.value = "";
    options.value = {};
  };

  const open = (ele: HTMLInputElement, opts = {}) => {
    if (ele instanceof HTMLInputElement) {
      element = ele;
      // select all text when open
      element.select();
      visible.value = true;
      value.value = ele.value;
      options.value = opts;

      options.value.inputElement = element;
    }
  };

  return {
    shiftElement,
    syncInput,
    value,
    options,
    visible,
    open,
    close,
  };
})();

export default () => store;
