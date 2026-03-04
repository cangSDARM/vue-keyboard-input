<script setup lang="ts">
import { useAsyncState } from "@vueuse/core";
import SignaturePad from "signature_pad";
import type { HandwritePad } from "./compositor";
import { nextTick } from "vue";

const props = defineProps<{
  onWrite: (image: string) => Promise<void>;
  to: string;
}>();
const emits = defineEmits(["error"]);

const { execute: write } = useAsyncState(props.onWrite, void 0, {
  onError(e) {
    emits("error", e);
  },
  immediate: false,
});

let padInstance: Maybe<SignaturePad> = null;

const onOk = () => {
  write(0, padInstance!.toDataURL("image/svg+xml"));
};

const vHandwriteArea = {
  mounted: (el: HTMLElement) => {
    const parent = el.parentElement;
    const sibling = el.previousElementSibling;
    const rect = sibling?.getBoundingClientRect();
    if (!rect) return;

    el.style.width = `${rect.width}px`;
    el.style.height = `${(parent?.getBoundingClientRect().height || rect.height) - rect.height}px`;
  },
};

const vPad = {
  mounted: async (canvas: HTMLCanvasElement) => {
    if (!canvas) return;
    await nextTick();

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement!.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    padInstance = new SignaturePad(canvas, {
      backgroundColor: "rgb(255, 255, 255)",
      penColor: "rgb(0, 0, 0)",
      minWidth: 2 * dpr,
      maxWidth: 2 * dpr * 2,
      throttle: 16,
      velocityFilterWeight: 0.7,
      minDistance: 5,
    });

    padInstance.addEventListener("endStroke", onOk);

    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);
  },
};

defineExpose<HandwritePad>({
  clean: () => {
    if (padInstance) {
      padInstance.clear();
    }
  },
});
</script>

<template>
  <Teleport defer :to="to">
    <div class="z-handwrite-pad-wrapper flex" v-handwrite-area>
      <div class="z-handwrite-pad hg-button">
        <canvas v-pad class="pad"></canvas>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.z-handwrite-pad {
  user-select: none;
  height: 100% !important;
  width: 100%;
  padding: 0;
  cursor: crosshair;

  .pad {
    touch-action: none;
  }
}
</style>
