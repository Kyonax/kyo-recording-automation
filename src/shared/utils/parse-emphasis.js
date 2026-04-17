/**
 * Copyright (c) 2026 Cristian D. Moreno — @Kyonax
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/
 *
 * parse-emphasis — parses **bold** markers in text into an
 * array of { text, bold } segments for Vue template rendering.
 */

const EMPHASIS_PATTERN = /\*\*(.+?)\*\*/g;

export function parseEmphasis(text) {
  if (!text) {
    return [];
  }

  const segments = [];
  let last_index = 0;

  for (const match of text.matchAll(EMPHASIS_PATTERN)) {
    if (match.index > last_index) {
      segments.push({
        text: text.slice(last_index, match.index),
        bold: false,
      });
    }

    segments.push({ text: match[1], bold: true });
    last_index = match.index + match[0].length;
  }

  if (last_index < text.length) {
    segments.push({ text: text.slice(last_index), bold: false });
  }

  return segments;
}
