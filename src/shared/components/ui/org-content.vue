<!--
  Copyright (c) 2026 Cristian D. Moreno — @Kyonax
  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/

  ui-org-content — domain-agnostic recursive renderer for org-mode
  ASTs produced by uniorg-parse. Walks `node.children` via v-for,
  dispatches one template branch per node type per Plan #context-
  screen D10 (futuristic-but-readable styling). Zero v-html, zero
  innerHTML — D11 (project ESLint bans innerHTML assignment via
  no-restricted-syntax; v-html compiles to innerHTML under the
  hood). All text content flows through Vue's template engine via
  mustache or scoped <span>; code blocks via <pre><code>{{ value }}
  </code></pre>.

  Self-referential — uses defineOptions({ name }) so the recursive
  template binding resolves.

  Props:
    ast — Array of OrgNode. Default empty array.
-->

<template>
  <div class="org-content">
    <template
      v-for="(node, index) in ast"
      :key="index"
    >
      <!-- section: unwrap, render its children -->
      <UiOrgContent
        v-if="node.type === 'section'"
        :ast="node.children"
      />

      <!-- headline: maps level 1 → h2 (page-level h1 lives in strip) -->
      <component
        :is="headlineTag(node.level)"
        v-else-if="node.type === 'headline'"
        :class="['org-headline', `org-headline--h${node.level}`]"
      >
        <UiOrgContent
          v-if="node.children && node.children.length"
          :ast="node.children"
        />
      </component>

      <!-- paragraph -->
      <p
        v-else-if="node.type === 'paragraph'"
        class="org-paragraph"
      >
        <UiOrgContent :ast="node.children" />
      </p>

      <!-- text leaf -->
      <span
        v-else-if="node.type === 'text'"
      >{{ node.value }}</span>

      <!-- inline marks -->
      <strong
        v-else-if="node.type === 'bold'"
        class="org-bold"
      >
        <UiOrgContent :ast="node.children" />
      </strong>
      <em
        v-else-if="node.type === 'italic'"
        class="org-italic"
      >
        <UiOrgContent :ast="node.children" />
      </em>
      <code
        v-else-if="node.type === 'verbatim'"
        class="org-verbatim"
      >{{ node.value }}</code>
      <code
        v-else-if="node.type === 'code'"
        class="org-inline-code"
      >{{ node.value }}</code>
      <s
        v-else-if="node.type === 'strike-through'"
        class="org-strike"
      >
        <UiOrgContent :ast="node.children" />
      </s>
      <u
        v-else-if="node.type === 'underline'"
        class="org-underline"
      >
        <UiOrgContent :ast="node.children" />
      </u>

      <!-- plain-list -->
      <ul
        v-else-if="node.type === 'plain-list' && node.listType === 'unordered'"
        class="org-list org-list--unordered"
      >
        <UiOrgContent :ast="node.children" />
      </ul>
      <ol
        v-else-if="node.type === 'plain-list' && node.listType === 'ordered'"
        class="org-list org-list--ordered"
      >
        <UiOrgContent :ast="node.children" />
      </ol>
      <dl
        v-else-if="node.type === 'plain-list' && node.listType === 'descriptive'"
        class="org-list org-list--descriptive"
      >
        <UiOrgContent :ast="node.children" />
      </dl>

      <!-- list-item (with optional checkbox) -->
      <li
        v-else-if="node.type === 'list-item'"
        :class="['org-list-item', checkboxModifierClass(node)]"
      >
        <span
          v-if="node.checkbox"
          class="org-checkbox"
        >{{ checkboxGlyph(node.checkbox) }}</span>
        <UiOrgContent :ast="node.children" />
      </li>

      <!-- table -->
      <table
        v-else-if="node.type === 'table'"
        class="org-table"
      >
        <tbody>
          <UiOrgContent :ast="node.children" />
        </tbody>
      </table>
      <tr
        v-else-if="node.type === 'table-row' && node.rowType === 'standard'"
        class="org-table__row"
      >
        <UiOrgContent :ast="node.children" />
      </tr>
      <td
        v-else-if="node.type === 'table-cell'"
        class="org-table__cell"
      >
        <UiOrgContent :ast="node.children" />
      </td>

      <!-- src-block: Shiki tokens when available; plain fallback otherwise.
           Each token is split into whitespace / non-whitespace runs so
           the WS runs can render with 2px-square indent markers. -->
      <pre
        v-else-if="node.type === 'src-block'"
        class="org-src-block"
      ><span
        v-if="node.language"
        class="org-src-block__lang"
      >{{ node.language }}</span><code
        v-if="tokenized.get(srcKey(node))"
        class="org-src-block__code"
      ><template
        v-for="(line, lineIdx) in tokenized.get(srcKey(node))"
        :key="lineIdx"
      ><template
        v-for="(tok, tIdx) in line"
        :key="tIdx"
      ><template
        v-for="(seg, sIdx) in splitWhitespaceSegments(tok.content)"
        :key="sIdx"
      ><span
        v-if="seg.is_ws"
        class="org-src-block__ws"
      >{{ seg.text }}</span><span
        v-else
        :style="{ color: tok.color }"
      >{{ seg.text }}</span></template></template>{{ '\n' }}</template></code><code
        v-else
        class="org-src-block__code"
      >{{ node.value }}</code></pre>

      <!-- #+RESULTS: block (fixed-width with affiliated.RESULTS) -->
      <pre
        v-else-if="node.type === 'fixed-width' && hasResults(node)"
        class="org-results"
      ><span class="org-results__label">OUTPUT</span><code class="org-results__code">{{ node.value }}</code></pre>

      <!-- example-block -->
      <pre
        v-else-if="node.type === 'example-block'"
        class="org-example"
      ><code>{{ node.value }}</code></pre>

      <!-- quote-block -->
      <blockquote
        v-else-if="node.type === 'quote-block'"
        class="org-quote"
      >
        <UiOrgContent :ast="node.children" />
      </blockquote>

      <!-- link -->
      <a
        v-else-if="node.type === 'link' && isExternalLink(node)"
        class="org-link"
        :href="node.rawLink"
        target="_blank"
        rel="noopener noreferrer"
      >
        <UiOrgContent
          v-if="node.children && node.children.length"
          :ast="node.children"
        />
        <span v-else>{{ node.rawLink }}</span>
      </a>
      <span
        v-else-if="node.type === 'link'"
        class="org-link org-link--internal"
      >
        <UiOrgContent
          v-if="node.children && node.children.length"
          :ast="node.children"
        />
        <span v-else>{{ node.rawLink }}</span>
      </span>

      <!-- horizontal rule -->
      <hr
        v-else-if="node.type === 'horizontal-rule'"
        class="org-hr"
      >

      <!-- property-drawer / drawer / unknown: silently filtered -->
    </template>
  </div>
</template>

<script setup>
import { highlightCode } from '@shared/utils/highlight.js';
import { ref, watch } from 'vue';

const HEADLINE_LEVEL_OFFSET = 1;
const MAX_HEADLINE_TAG = 6;

const CHECKBOX_GLYPH_OFF = '▢';
const CHECKBOX_GLYPH_ON = '▣';
const CHECKBOX_GLYPH_TRANS = '▨';

const EXTERNAL_LINK_TYPES = new Set([
  'http',
  'https',
  'ftp',
  'mailto',
  'tel',
]);

defineOptions({ name: 'UiOrgContent' });

const props = defineProps({
  ast: {
    type: Array,
    default: () => [],
  },
});

const tokenized = ref(new Map());

function headlineTag(level) {
  const target = (level || 1) + HEADLINE_LEVEL_OFFSET;
  const clamped = target > MAX_HEADLINE_TAG ? MAX_HEADLINE_TAG : target;
  return `h${clamped}`;
}

function checkboxGlyph(state) {
  if (state === 'on') {
    return CHECKBOX_GLYPH_ON;
  }
  if (state === 'trans') {
    return CHECKBOX_GLYPH_TRANS;
  }
  return CHECKBOX_GLYPH_OFF;
}

function checkboxModifierClass(node) {
  if (!node.checkbox) {
    return '';
  }
  if (node.checkbox === 'on') {
    return 'org-list-item--done';
  }
  if (node.checkbox === 'trans') {
    return 'org-list-item--partial';
  }
  return 'org-list-item--todo';
}

function hasResults(node) {
  return Boolean(node.affiliated && 'RESULTS' in node.affiliated);
}

function isExternalLink(node) {
  return EXTERNAL_LINK_TYPES.has(node.linkType);
}

function srcKey(node) {
  return `${node.language || 'plain'}::${node.value}`;
}

/*
 * Split a Shiki token's content into alternating whitespace / non-
 * whitespace runs so the template can render each whitespace run as a
 * <span class="org-src-block__ws"> with a 2px-square marker per 1ch
 * column. Non-whitespace runs render with the token's syntax color.
 */
function splitWhitespaceSegments(content) {
  if (typeof content !== 'string' || content.length === 0) {
    return [];
  }
  const segments = [];
  let i = 0;
  while (i < content.length) {
    const start_is_ws = content[i] === ' ' || content[i] === '\t';
    let j = i + 1;
    while (j < content.length) {
      const char_is_ws = content[j] === ' ' || content[j] === '\t';
      if (char_is_ws !== start_is_ws) {
        break;
      }
      j++;
    }
    segments.push({
      text: content.slice(i, j),
      is_ws: start_is_ws,
    });
    i = j;
  }
  return segments;
}

function collectSrcBlocks(nodes, sink) {
  for (const node of nodes) {
    if (node.type === 'src-block' && typeof node.value === 'string') {
      sink.push(node);
    }
    if (Array.isArray(node.children) && node.children.length) {
      collectSrcBlocks(node.children, sink);
    }
  }
}

async function tokenizeAst(nodes) {
  const blocks = [];
  collectSrcBlocks(nodes, blocks);
  for (const node of blocks) {
    const key = srcKey(node);
    if (tokenized.value.has(key)) {
      continue;
    }
    const tokens = await highlightCode(node.value, node.language);
    if (tokens) {
      const next = new Map(tokenized.value);
      next.set(key, tokens);
      tokenized.value = next;
    }
  }
}

watch(
  () => props.ast,
  (next_ast) => {
    if (Array.isArray(next_ast) && next_ast.length) {
      tokenizeAst(next_ast);
    }
  },
  { immediate: true },
);
</script>

<style scoped lang="scss">
@use "@app/scss/abstracts/mixins" as *;

.org-content {
  display: flex;
  flex-direction: column;
  gap: 0.85em;
  font-family: var(--font-mono);
  font-size: var(--fs-225);
  line-height: var(--fs-450);
  color: var(--clr-neutral-200);
  contain: layout paint;
}

/* Headlines — Geomanist with a vertical-line accent left of every level */
.org-headline {
  font-family: var(--font-display);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--clr-primary-100);
  margin-top: 0.6em;
  margin-bottom: 0.1em;
  border-radius: 0;
  position: relative;
  padding-left: 0.7em;
}

.org-headline::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.15em;
  bottom: 0.15em;
  width: 3px;
  background-color: var(--clr-primary-100);
}

.org-headline--h1 { font-size: var(--fs-475); }
.org-headline--h2 { font-size: var(--fs-400); }
.org-headline--h3 { font-size: var(--fs-350); }
.org-headline--h4 { font-size: var(--fs-300); }

.org-paragraph {
  margin: 0;
}

/* Inline marks */
.org-bold {
  font-weight: 700;
  color: var(--clr-primary-100);
}

.org-italic {
  font-style: italic;
  color: var(--clr-neutral-200);
}

.org-verbatim,
.org-inline-code {
  font-family: var(--font-mono);
  font-size: 0.9em;
  background: var(--clr-primary-100-14);
  color: var(--clr-primary-100);
  padding: 0.05em 0.4em;
  border-radius: 0;
}

.org-strike {
  text-decoration: line-through;
  opacity: 0.55;
}

/* Lists */
.org-list {
  margin: 0;
  padding-left: 1.4em;
  display: flex;
  flex-direction: column;
  gap: 0.35em;
  list-style: none;
}

.org-list--unordered .org-list-item:not(.org-list-item--done):not(
    .org-list-item--partial):not(.org-list-item--todo)::before {
  content: '\276F';
  color: var(--clr-primary-100);
  margin-right: 0.6em;
  font-weight: 700;
  display: inline-block;
}

.org-list--ordered {
  list-style: decimal;
  padding-left: 1.6em;
  color: var(--clr-primary-100);
}

.org-list--ordered .org-list-item {
  color: var(--clr-neutral-50);
}

.org-list-item {
  border-radius: 0;
  padding-left: 0.1em;
}

/* Unordered list-items use flex baseline so the bullet/checkbox + the
 * paragraph child sit on the same line. Ordered lists keep default
 * block flow so the browser's `list-style: decimal` numbering renders. */
.org-list--unordered .org-list-item {
  display: flex;
  align-items: baseline;
  gap: 0.45em;
}

.org-list--unordered .org-list-item > .org-paragraph {
  margin: 0;
  flex: 1 1 auto;
  min-width: 0;
}

.org-list--ordered .org-list-item > .org-paragraph {
  margin: 0;
  display: inline;
}

/* Checkboxes — distinct color per state */
.org-list-item--done .org-checkbox { color: var(--clr-success-100); }
.org-list-item--partial .org-checkbox { color: var(--clr-warning-100); }
.org-list-item--todo .org-checkbox { color: var(--clr-neutral-100); }

.org-list-item--done {
  color: color-mix(in srgb, var(--clr-neutral-50) 65%, transparent);
}

.org-checkbox {
  display: inline-block;
  margin-right: 0.55em;
  font-family: var(--font-mono);
  font-size: 1.05em;
  vertical-align: -0.05em;
}

/* Tables — bordered, header-row distinct, alternate rows subtle */
.org-table {
  border-collapse: collapse;
  width: 100%;
  font-family: var(--font-mono);
  font-size: var(--fs-200);
  border: 1px solid var(--clr-primary-100);
  border-radius: 0;
  margin: 0.3em 0;
  @include corner-dots(var(--clr-primary-100));
}

.org-table__row {
  border-top: 1px solid var(--clr-border-200);
}

.org-table__row:first-child {
  background: var(--clr-primary-100-10);
  border-top: none;
}

.org-table__row:first-child .org-table__cell {
  color: var(--clr-primary-100);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.org-table__row:nth-child(odd):not(:first-child) {
  background: var(--clr-neutral-50-04);
}

.org-table__cell {
  padding: 0.45em 0.85em;
  border-right: 1px solid var(--clr-border-200);
  vertical-align: top;
}

.org-table__cell:last-child {
  border-right: none;
}

/* Code blocks — same surface aesthetic as the rest of the HUD: low-alpha
 * tint background + 1px solid border in the matching saturated color.
 * Src blocks use neutral; output blocks use primary (gold). Tokens only,
 * no inline rgba/hsl literals. */
.org-src-block,
.org-results,
.org-example {
  position: relative;
  font-family: var(--font-mono);
  font-size: var(--fs-150);
  line-height: var(--fs-300);
  padding: 1em 1.1em 0.85em;
  margin: 0.3em 0;
  overflow-x: auto;
  border-radius: 0;
  border: 1px solid;
  contain: layout paint;
}

.org-src-block {
  --ws-marker: var(--clr-neutral-300);
  background-color: var(--clr-neutral-50-04);
  border-color: var(--clr-neutral-300);
  color: var(--clr-neutral-100);
  @include corner-dots(var(--clr-neutral-300));
}

.org-results {
  --ws-marker: var(--clr-primary-300);
  background-color: var(--clr-primary-100-06);
  border-color: var(--clr-primary-100);
  color: var(--clr-primary-100);
  font-weight: 500;
  @include corner-dots(var(--clr-primary-100));
}

.org-example {
  --ws-marker: var(--clr-neutral-300);
  background-color: var(--clr-neutral-50-02);
  border-color: var(--clr-neutral-400);
  color: var(--clr-neutral-200);
  @include corner-dots(var(--clr-neutral-400));
}

/*
 * Whitespace markers — paint a 2px-wide colored stripe at the center of
 * each 1ch-wide column via repeating linear-gradient. The gradient is
 * 1ch tall (height-tile) with the colored band centered horizontally;
 * the result is a visible 2px square per character, helpful for tab /
 * indent visibility. Color = --ws-marker (set per-block above).
 */
.org-src-block__ws {
  position: relative;
  display: inline-block;
  background-image: linear-gradient(
    to right,
    transparent calc((1ch - 2px) / 2),
    var(--ws-marker, currentColor) calc((1ch - 2px) / 2),
    var(--ws-marker, currentColor) calc((1ch + 2px) / 2),
    transparent calc((1ch + 2px) / 2)
  );
  background-size: 1ch 2px;
  background-position: 0 50%;
  background-repeat: repeat-x;
}

.org-src-block__lang,
.org-results__label {
  position: absolute;
  top: 0.3em;
  right: 0.55em;
  font-family: var(--font-mono);
  font-size: var(--fs-125);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  padding: 0.05em 0.45em;
  border-radius: 0;
}

.org-src-block__lang {
  color: var(--clr-primary-100);
  background: var(--clr-primary-100-14);
  border: 1px solid var(--clr-primary-100);
}

.org-results__label {
  /* Lifted-black banner over the gold container; text in neutral-200. */
  color: var(--clr-neutral-200);
  background-color: lighten(--clr-neutral-500, 8%);
  border: 1px solid var(--clr-neutral-500);
}

.org-src-block__code,
.org-results__code {
  display: block;
  white-space: pre;
  word-break: keep-all;
}

/* Quotes — gold-tint bg + full-border treatment matching the design language */
.org-quote {
  margin: 0.2em 0;
  padding: 0.6em 0.9em 0.6em 1em;
  border: 1px solid var(--clr-primary-100);
  border-left-width: 3px;
  background-color: var(--clr-primary-100-04);
  font-style: italic;
  color: var(--clr-neutral-200);
  @include corner-dots(var(--clr-primary-100));
}

/* Links */
.org-link {
  color: var(--clr-primary-100);
  text-decoration: underline;
  text-underline-offset: 2px;
  text-decoration-color: var(--clr-primary-100-40);
}

.org-link:hover {
  text-decoration-color: var(--clr-primary-100);
}

.org-link--internal {
  color: var(--clr-neutral-100);
  text-decoration: none;
}

/* Horizontal rule */
.org-hr {
  border: none;
  border-top: 1px solid var(--clr-border-200);
  margin: 0.8em 0;
}
</style>
