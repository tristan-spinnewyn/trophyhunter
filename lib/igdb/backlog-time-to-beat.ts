// lib/igdb/backlog-time-to-beat.ts
// How long the games of a backlog take to beat: from the cache, completed by IGDB when stale.

import { getUserOwnedGames } from "@/lib/db";
import type { GameDurations } from "@/lib/types";
import { getStoredTimeToBeat, saveTimeToBeat, type StoredTimeToBeat } from "@/lib/db/time-to-beat";
import { resolveGameStatus } from "@/lib/game-status/game-status.services";
import { isIgdbConfigured } from "./igdb-client";
import { lookupTimeToBeat } from "./time-to-beat-lookup";

const DAY_MS = 24 * 60 * 60 * 1000;
/** Durations change slowly; a game IGDB does not know may be added sooner. */
const FOUND_TTL_MS = 30 * DAY_MS;
const UNKNOWN_TTL_MS = 7 * DAY_MS;

function isFresh(entry: StoredTimeToBeat, now: number): boolean {
  const ttl = entry.igdbGameId === null ? UNKNOWN_TTL_MS : FOUND_TTL_MS;
  return now - new Date(entry.fetchedAt).getTime() < ttl;
}

const NO_ENTRY = { igdbGameId: null, hastilySeconds: null, normallySeconds: null, completelySeconds: null };

/** Durations of the user's backlog games, keyed `platform_appId`; games without any known duration are left out. */
export async function getBacklogTimeToBeat(userId: string): Promise<Record<string, GameDurations>> {
  if (!isIgdbConfigured()) return {};

  const backlog = getUserOwnedGames(userId).filter((g) => resolveGameStatus(g.status) === "backlog");
  const stored = getStoredTimeToBeat(backlog);
  const now = Date.now();
  const stale = backlog.filter((g) => {
    const entry = stored.get(`${g.platform}_${g.appId}`);
    return !entry || !isFresh(entry, now);
  });

  if (stale.length > 0) {
    try {
      const found = await lookupTimeToBeat(stale.map(({ appId, platform, name }) => ({ appId, platform, name })));
      const entries = new Map([...found].map(([key, value]) => [key, value ?? NO_ENTRY]));
      const fetchedAt = new Date(now).toISOString();
      saveTimeToBeat(entries, fetchedAt);
      for (const [key, entry] of entries) stored.set(key, { ...entry, fetchedAt });
    } catch (err) {
      // The cache still answers; the stale games are asked again next time.
      console.error("IGDB time-to-beat lookup failed:", err);
    }
  }

  const durations: Record<string, GameDurations> = {};
  for (const [key, entry] of stored) {
    if (entry.hastilySeconds === null && entry.normallySeconds === null && entry.completelySeconds === null) continue;
    durations[key] = {
      hastilySeconds: entry.hastilySeconds,
      normallySeconds: entry.normallySeconds,
      completelySeconds: entry.completelySeconds,
    };
  }
  return durations;
}
