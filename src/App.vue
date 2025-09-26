<script setup>
import { onBeforeMount, onMounted, ref, useTemplateRef } from "vue";
import CncharKeyboard from "./components/CncharKeyboard/index.vue";
import RimeKeyboard from "./components/RimeKeyboard/index.vue";
import useCncharKeyboard from "./composables/useCncharKeyboard";
import useRimeKeyboard from "./composables/useRimeKeyboard";
import { initIME } from "./services/IME/Provider";

/// cnchar's keyboard
const valueA = ref("shuguodapei");
const valueB = ref("ibuxing");
const valueC = ref("biang");
const cncharKeyboard = useCncharKeyboard();

/// rime's keyboard
const rimeKeyboard = useRimeKeyboard();
const valueD = ref("biang");
const valueE = ref("ibuxing");
const valueF = ref("shugodapei");

const toggleKeyboard = ref(false);

onBeforeMount(() => {
  initIME();
});
</script>

<template>
  <button @click="toggleKeyboard = !toggleKeyboard">toggle Keyboard</button>
  <p>Current Keyboard: {{ toggleKeyboard ? "cnchar" : "rime" }}</p>
  <div class="sample">
    <h2>Cnchar Keyboard Sample</h2>
    <v-text-field
      v-model="valueA"
      clearable
      label="Label"
      @focus="cncharKeyboard.open($event.target)"
    />
    <v-text-field
      v-model="valueB"
      clearable
      label="Label"
      @focus="cncharKeyboard.open($event.target)"
    />
    <v-text-field
      v-model="valueC"
      clearable
      label="Label"
      @focus="cncharKeyboard.open($event.target)"
    />
    <h2>Rime Keyboard Sample</h2>
    <v-text-field
      v-model="valueD"
      clearable
      label="Label"
      @focus="rimeKeyboard.open($event.target)"
    />
    <v-text-field
      v-model="valueE"
      clearable
      label="Label"
      @focus="rimeKeyboard.open($event.target)"
    />
    <v-text-field
      v-model="valueF"
      clearable
      label="Label"
      @focus="rimeKeyboard.open($event.target)"
    />
  </div>
  <CncharKeyboard
    v-if="toggleKeyboard"
    @close="cncharKeyboard.close"
    @change="cncharKeyboard.syncInput"
    :visible="cncharKeyboard.visible.value"
    v-model:default="cncharKeyboard.value.value"
    hide-on-blur
  />
  <RimeKeyboard
    v-if="!toggleKeyboard"
    @close="rimeKeyboard.close"
    @change="rimeKeyboard.syncInput"
    :visible="rimeKeyboard.visible.value"
    v-model:default="rimeKeyboard.value.value"
    v-bind="rimeKeyboard.options.value"
    hide-on-blur
    shift-element="#app"
    type="shifted"
  ></RimeKeyboard>
</template>

<style scoped lang="scss">
.sample {
  width: 50vw;
}
</style>
