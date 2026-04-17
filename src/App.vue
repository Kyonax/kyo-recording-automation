<!--
  Copyright (c) 2026 Cristian D. Moreno — @Kyonax
  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/
-->

<template>
  <div
    :class="brand_class"
    :style="brand_theme_vars"
  >
    <router-view />
  </div>
</template>

<script setup>
import { BRANDS } from '@shared/brand-loader.js';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const brand_class = computed(() => {
  const handle = route.meta?.brand;

  if (!handle) {
    return '';
  }

  return `brand-${handle.replace('@', '').replace(/_/g, '-')}`;
});

const brand_theme_vars = computed(() => {
  const handle = route.meta?.brand;

  if (!handle) {
    return {};
  }

  const brand = BRANDS.find((b) => b.handle === handle);

  if (!brand?.colors || !Object.keys(brand.colors).length) {
    return {};
  }

  const vars = {};

  for (const [key, value] of Object.entries(brand.colors)) {
    vars[`--clr-${key.replace(/_/g, '-')}`] = value;
  }

  return vars;
});
</script>

<style lang="scss">
@use "@app/scss/main.scss";
</style>
