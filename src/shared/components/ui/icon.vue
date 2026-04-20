<!--
  Copyright (c) 2026 Cristian D. Moreno — @Kyonax
  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/

  svg-icon — renders an SVG file from shared/assets/svg by name.
  Uses Vite import.meta.glob with ?raw to inline SVGs at build
  time. Color inherits from CSS via currentColor in the SVG source.

  Props:
    name — filename without extension (e.g. "corner-bracket")
    size — optional width/height in pixels. Omit to let CSS control sizing.
-->

<template>
  <span
    v-if="svg_content"
    class="svg-icon"
    :role="label ? 'img' : undefined"
    :aria-label="label || undefined"
    :aria-hidden="label ? undefined : 'true'"
    :style="size_style"
    v-html="svg_content"
  />
</template>

<script setup>
import { computed } from 'vue';

const svg_modules = import.meta.glob(
  '@shared/assets/svg/*.svg',
  { eager: true, query: '?raw', import: 'default' },
);

const svg_map = Object.fromEntries(
  Object.entries(svg_modules).map(([path, raw]) => {
    const filename = path.split('/').pop().replace('.svg', '');
    return [filename, raw];
  }),
);

const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    default: '',
  },
  size: {
    type: Number,
    default: 0,
  },
});

const svg_content = computed(() => {
  return svg_map[props.name] || '';
});

const size_style = computed(() => {
  if (!props.size) {
    return {};
  }

  return {
    width: `${props.size}px`,
    height: `${props.size}px`,
  };
});
</script>

<style scoped lang="scss">
.svg-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 0;
}

.svg-icon :deep(svg) {
  width: 100%;
  height: 100%;
}
</style>
