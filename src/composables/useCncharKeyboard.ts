
import { ref } from "vue";

export default function useCncharKeyboard() {
  let element: HTMLInputElement | null = null;
  const visible = ref(false);
  const value = ref("");

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
  };
  const open = (ele: HTMLElement) => {
    if (ele instanceof HTMLInputElement) {
      element = ele;
      visible.value = true;
      value.value = ele.value;
    }
  };

  return {
    syncInput,
    value,
    visible,
    open,
    close,
  };
};
