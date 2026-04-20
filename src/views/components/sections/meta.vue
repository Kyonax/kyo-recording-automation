<!--
  Copyright (c) 2026 Cristian D. Moreno — @Kyonax
  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/

  meta — sticky top stats strip showing SOURCES / BRANDS / READY /
  CANVAS counters. Spans edge-to-edge via negative horizontal
  margins that cancel the `.home` container padding.
-->

<template>
  <div class="home-meta-bar">
    <div class="home-meta">
      <div class="meta-item">
        <span class="meta-label">SOURCES</span>
        <span class="meta-value">{{ overlay_count }}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">BRANDS</span>
        <span class="meta-value">{{ brand_count }}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">READY</span>
        <span class="meta-value">{{ ready_count }}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">CANVAS</span>
        <span class="meta-value">1920 × 1080 @ 60</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  overlay_count: {
    type: Number,
    required: true,
  },
  brand_count: {
    type: Number,
    required: true,
  },
  ready_count: {
    type: Number,
    required: true,
  },
});
</script>

<style scoped lang="scss">
@use "@app/scss/abstracts/mixins" as *;

.home-meta-bar {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--clr-border-100);
  padding: 1em 0;
  margin: 0 -5em 2em;
}

.home-meta {
  display: flex;
  align-items: center;
  gap: 3em;
  padding: 0 5em;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 0.25em;
}

.meta-label {
  @include hud-label-base;
  position: static;
  font-size: var(--fs-125);
  letter-spacing: 0.3em;
  opacity: 0.5;
}

.meta-value {
  font-family: var(--font-mono);
  font-size: var(--fs-525);
  color: var(--clr-primary-100);
  font-variant-numeric: tabular-nums;
}
</style>
