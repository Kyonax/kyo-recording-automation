<!--
  Copyright (c) 2026 Cristian D. Moreno — @Kyonax
  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/

  detail-modal — full overlay detail view. Shows the complete
  description, all use_cases, and all requirements without
  truncation. Uses base-modal for the generic modal shell.
-->

<template>
  <base-modal
    :is_open="is_open"
    :max_width="MODAL_WIDTH"
    @close="$emit('close')"
  >
    <template #header>
      <span class="detail-brand">{{ overlay.brand }}</span>
      <span class="detail-title">{{ overlay.name }}</span>
      <span
        class="detail-status"
        :class="{ 'is-planned': overlay.status === 'planned' }"
      >
        {{ overlay.status }}
      </span>
    </template>

    <div class="detail-content">
      <section class="detail-section">
        <span class="detail-label">DESCRIPTION</span>
        <p class="detail-description">
          <template
            v-for="(segment, index) in description_segments"
            :key="index"
          >
            <strong
              v-if="segment.bold"
              class="emphasis"
            >{{ segment.text }}</strong>
            <template v-else>{{ segment.text }}</template>
          </template>
        </p>
      </section>

      <section
        v-if="overlay.use_cases && overlay.use_cases.length"
        class="detail-section"
      >
        <span class="detail-label">USE CASES</span>
        <ul class="detail-tags">
          <li
            v-for="(keyword, index) in overlay.use_cases"
            :key="index"
            class="detail-tag"
          >
            {{ keyword }}
          </li>
        </ul>
      </section>

      <section class="detail-section">
        <span class="detail-label">SPECS</span>
        <div class="detail-spec-grid">
          <div class="detail-spec">
            <span class="spec-key">SIZE</span>
            <span class="spec-val">
              {{ overlay.width }} × {{ overlay.height }}
            </span>
          </div>
          <div class="detail-spec">
            <span class="spec-key">FPS</span>
            <span class="spec-val">{{ overlay.fps }}</span>
          </div>
          <div class="detail-spec">
            <span class="spec-key">CACHE</span>
            <span class="spec-val">DISABLE</span>
          </div>
          <div class="detail-spec">
            <span class="spec-key">CSS</span>
            <span class="spec-val">CLEAR</span>
          </div>
        </div>
      </section>

      <section
        v-if="overlay.requires.length"
        class="detail-section"
      >
        <span class="detail-label">REQUIREMENTS</span>
        <ul class="detail-requires">
          <li
            v-for="(req, index) in overlay.requires"
            :key="index"
          >
            {{ req }}
          </li>
        </ul>
      </section>
    </div>
  </base-modal>
</template>

<script setup>
import { computed } from 'vue';

import BaseModal from './base-modal.vue';
import { parseEmphasis } from '../utils/parse-emphasis.js';

const MODAL_WIDTH = 'min(720px, calc(100vw - 4em))';

const props = defineProps({
  overlay: {
    type: Object,
    required: true,
  },
  is_open: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['close']);

const description_segments = computed(() => {
  return parseEmphasis(props.overlay.description);
});
</script>

<style scoped lang="scss">
@use "../../app/scss/abstracts/mixins" as *;

.detail-content {
  padding: 0 1.25em 1.25em;
}

.detail-brand {
  @include hud-label-base;
  position: static;
  font-size: var(--fs-175);
  color: var(--clr-primary-100);
  letter-spacing: 0.2em;
  opacity: 0.7;
}

.detail-title {
  font-family: var(--font-mono);
  font-size: var(--fs-475);
  font-weight: 700;
  color: var(--clr-neutral-50);
  letter-spacing: 0.05em;
}

.detail-status {
  @include hud-label-base;
  position: static;
  padding: 0.25em 0.65em;
  font-size: var(--fs-150);
  border: 1px solid var(--clr-primary-100);
  color: var(--clr-primary-100);
  letter-spacing: 0.18em;
  white-space: nowrap;
}

.detail-status.is-planned {
  border-color: var(--clr-neutral-200);
  color: var(--clr-neutral-200);
}

.detail-section {
  padding: 1.25em 0;
  border-top: 1px dashed var(--clr-border-100);
  display: flex;
  flex-direction: column;
  gap: 0.75em;
}

.detail-section:first-child {
  border-top: none;
  padding-top: 0.75em;
}

.detail-label {
  @include hud-label-base;
  position: static;
  font-size: var(--fs-150);
  letter-spacing: 0.25em;
  color: var(--clr-primary-100);
  opacity: 0.6;
}

.detail-description {
  font-size: var(--fs-275);
  line-height: 1.55;
  color: var(--clr-neutral-100);
  opacity: 0.8;
  margin: 0;
}

.detail-description .emphasis {
  color: var(--clr-neutral-50);
  font-weight: 700;
  opacity: 1;
}

.detail-tags {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4em;
  padding: 0;
  margin: 0;
}

.detail-tag {
  padding: 0.25em 0.6em;
  font-family: var(--font-mono);
  font-size: var(--fs-175);
  letter-spacing: 0.1em;
  color: var(--clr-primary-100);
  background: rgba(255, 215, 0, 0.06);
  border: 1px solid var(--clr-border-100);
  text-transform: lowercase;
  white-space: nowrap;
}

.detail-spec-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75em 1em;
}

.detail-spec {
  display: flex;
  flex-direction: column;
  gap: 0.2em;
}

.spec-key {
  @include hud-label-base;
  position: static;
  font-size: var(--fs-150);
  letter-spacing: 0.18em;
  opacity: 0.5;
}

.spec-val {
  font-family: var(--font-mono);
  font-size: var(--fs-300);
  color: var(--clr-primary-100);
  font-variant-numeric: tabular-nums;
}

.detail-requires {
  list-style: none;
  display: grid;
  gap: 0.35em;
  padding-left: 1em;
  margin: 0;
}

.detail-requires li {
  font-family: var(--font-mono);
  font-size: var(--fs-250);
  line-height: 1.4;
  color: var(--clr-neutral-100);
  opacity: 0.75;
  position: relative;
  word-break: break-word;
}

.detail-requires li::before {
  content: "›";
  position: absolute;
  left: -1em;
  color: var(--clr-primary-100);
}
</style>
