<script setup>
import { ref, useTemplateRef } from "vue";
import SimpleKeyboard from "./components/SimpleKeyboard/index.vue";

const useKeyboard = () => {
  let element = {};
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
  const open = (ele) => {
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

const valueA = ref("shuguodapei");
const valueB = ref("ibuxing");
const valueC = ref("biang");
const keyboard = useKeyboard();
</script>

<template>
  <div class="sample">
    <v-text-field
      v-model="valueA"
      clearable
      label="Label"
      @focus="keyboard.open($event.target)"
    />
    <v-text-field
      v-model="valueB"
      clearable
      label="Label"
      @focus="keyboard.open($event.target)"
    />
    <v-text-field
      v-model="valueC"
      clearable
      label="Label"
      @focus="keyboard.open($event.target)"
    />
  </div>
  <SimpleKeyboard
    @close="keyboard.close"
    @change="keyboard.syncInput"
    :visible="keyboard.visible.value"
    v-model:default="keyboard.value.value"
    hide-on-blur
  />
</template>

<style scoped lang="scss">
.sample {
  width: 50vw;
}
</style>
