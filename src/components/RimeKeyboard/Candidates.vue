<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  preview?: string[];
  candidates: string[];
  selectCandidate: (candidate: string, index: number) => void;
  gotoPage: (page: number) => void;
  pagination: {
    isLastPage?: boolean;
    current: number;
    totalPages: number;
  };
}>();

const nextDisabled = computed(() => props.pagination.isLastPage || props.candidates.length === 0);
</script>

<template>
  <div class="candidates">
    <section class="preview">{{ preview?.join("'") }}</section>
    <section class="row">
      <v-btn
        variant="flat"
        v-for="(item, index) in candidates"
        :key="index"
        class="item"
        @click.prevent="selectCandidate(item, index)"
      >
        {{ item }}
      </v-btn>
    </section>
    <section class="actions">
      <v-btn
        variant="text"
        :disabled="pagination.current <= 0"
        @click.stop="gotoPage(pagination.current - 1)"
        class="page-btn"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M10 12L6 8L10 4"
            stroke="#666"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </v-btn>
      <v-btn
        variant="text"
        :disabled="nextDisabled"
        @click.stop="gotoPage(pagination.current + 1)"
        class="page-btn"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M6 4L10 8L6 12"
            stroke="#666"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </v-btn>
      <span class="page-info">
        {{ pagination.current + 1 }}
        {{ pagination.totalPages > 0 ? ' / ' + pagination.totalPages : '' }}
      </span>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.candidates {
  font-family: SourceHanSans, Ariral, Plangothic;
  width: 100%;
  padding: 4px 6px;
  background: rgb(var(--v-theme-surface));
  position: relative;

  font-size: 1.25em;
  border-top: 1px solid #ddd;
  border-radius: 6px;

  display: flex;
  flex-direction: row;
  align-items: center;
  flex-wrap: nowrap;

  .preview {
    cursor: default;
    position: absolute;
    top: 0;
    transform: translateY(-100%);
    display: flex;
    background-color: #888;
    color: white;
  }

  .row {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    flex-wrap: nowrap;
    overflow: auto;
    scrollbar-width: thin;

    gap: 0.2em;
    flex: 1;

    .item {
      min-width: unset;
      user-select: none;
      font-size: 1em !important;

      padding: 0 2px;

      cursor: pointer;
    }
  }

  .actions {
    .page-info {
      margin-left: 12px;
      color: #888;

      font-size: 0.8em;
      font-weight: 500;

      text-align: center;
      letter-spacing: 1px;
    }
  }
}
</style>
