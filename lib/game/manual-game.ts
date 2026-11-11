// lib/game/manual-game.ts

import type { GameDetails } from "@/lib/types";
import { buildPsthcGuideUrl } from "./guide-urls";

/**
 * Games added by hand without a store match get an id in a range no store uses
 * (Steam app ids stay far below it), derived from the title so the same game keeps the same id.
 */
const MANUAL_ID_BASE = 1_900_000_000;
const MANUAL_ID_SPAN = 100_000_000;

function normalizeTitle(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, " ");
}

/** FNV-1a, enough to spread titles over the manual id range. */
function hashTitle(title: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < title.length; i++) {
    hash ^= title.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

export function manualGameId(title: string): number {
  return MANUAL_ID_BASE + (hashTitle(normalizeTitle(title)) % MANUAL_ID_SPAN);
}

export function isManualGameId(appId: number): boolean {
  return appId >= MANUAL_ID_BASE && appId < MANUAL_ID_BASE + MANUAL_ID_SPAN;
}

/** What the game page shows for a game added by hand: its name and guides searched by name, no achievements. */
export function manualGameDetails(appId: number, name: string): GameDetails {
  return {
    id: appId,
    name,
    headerImg: "",
    totalAchievements: 0,
    achievements: [],
    guideLinks: {
      steamGuidesUrl: "",
      psthcUrl: buildPsthcGuideUrl(name),
      youtubeUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${name} guide fr`)}`,
    },
  };
}
