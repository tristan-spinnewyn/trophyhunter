// lib/library/spine-style.ts

import type { OwnedGame } from "@/lib/types";

export interface SpineColour {
  readonly background: string;
  readonly foreground: string;
}

export interface SpineStyle extends SpineColour {
  readonly widthPx: number;
  readonly heightPx: number;
}

const LIGHT_TITLE = "#f5efe4";
const DARK_TITLE = "#231a0c";

/** Box-spine colours: saturated but dusty, so a full shelf stays calm next to the covers. */
export const SPINE_PALETTE: readonly SpineColour[] = [
  { background: "#2b2b2b", foreground: LIGHT_TITLE },
  { background: "#a82e28", foreground: LIGHT_TITLE },
  { background: "#3c1d4f", foreground: LIGHT_TITLE },
  { background: "#e8dcc0", foreground: DARK_TITLE },
  { background: "#1d3b5c", foreground: LIGHT_TITLE },
  { background: "#7a1a1a", foreground: LIGHT_TITLE },
  { background: "#b83d5c", foreground: LIGHT_TITLE },
  { background: "#1f4b3e", foreground: LIGHT_TITLE },
  { background: "#c5a46a", foreground: DARK_TITLE },
  { background: "#202a33", foreground: LIGHT_TITLE },
  { background: "#4a3a24", foreground: LIGHT_TITLE },
  { background: "#13557a", foreground: LIGHT_TITLE },
  { background: "#3b5d2a", foreground: LIGHT_TITLE },
  { background: "#5b2e86", foreground: LIGHT_TITLE },
  { background: "#c8a83a", foreground: DARK_TITLE },
  { background: "#8d3b2f", foreground: LIGHT_TITLE },
];

const MIN_WIDTH = 42;
const WIDTH_STEPS = 19; // 42..60 px
const MIN_HEIGHT = 226;
const HEIGHT_STEPS = 45; // 226..270 px

/** FNV-1a: a tiny stable hash, so a game keeps its spine across sessions. */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function getSpineStyle(game: Pick<OwnedGame, "appId" | "name" | "platform">): SpineStyle {
  const seed = hash(`${game.platform}:${game.appId}:${game.name}`);
  const colour = SPINE_PALETTE[seed % SPINE_PALETTE.length];
  return {
    ...colour,
    widthPx: MIN_WIDTH + ((seed >>> 8) % WIDTH_STEPS),
    heightPx: MIN_HEIGHT + ((seed >>> 16) % HEIGHT_STEPS),
  };
}

/** WCAG relative luminance of a #rrggbb colour. */
export function relativeLuminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
