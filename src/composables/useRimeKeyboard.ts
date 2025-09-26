import { ref, shallowRef } from "vue";

export default function () {
  let element: HTMLInputElement | null = null;
  const visible = ref(false);
  const value = ref("");
  const options = shallowRef<Record<string, any>>({});

  const syncInput = () => {
    if (element) {
      element.value = value.value;
      element.dispatchEvent(new Event("input", { bubbles: true }));
    }
  };

  const close = () => {
    syncInput();
    visible.value = false;
    element = null;
    value.value = "";
    options.value = {};
  };

  const open = (ele: HTMLElement, opts = {}) => {
    if (ele instanceof HTMLInputElement) {
      element = ele;
      visible.value = true;
      value.value = ele.value;
      options.value = opts;

      options.value.inputElement = element;
    }
  };

  return {
    syncInput,
    value,
    options,
    visible,
    open,
    close,
  };
}
