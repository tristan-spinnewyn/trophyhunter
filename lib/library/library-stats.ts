// lib/library/library-stats.ts

import type { OwnedGame } from "@/lib/types";
import { ALL_PLATFORMS } from "@/lib/platforms";
import { normalizeGameTitle } from "@/lib/game-title";

export interface EpicGameCounts {
  readonly total: number;
  readonly withAch: number;
  readonly noAch: number;
}

export interface DuplicateGroup {
  readonly title: string;
  readonly games: OwnedGame[];
}

export function calculateDuplicateGroups(ownedGames: OwnedGame[]): DuplicateGroup[] {
  const groups = new Map<string, OwnedGame[]>();
  for (const g of ownedGames) {
    const norm = normalizeGameTitle(g.name);
    if (!norm) continue;
    const arr = groups.get(norm) || [];
    arr.push(g);
    groups.set(norm, arr);
  }
  const result: DuplicateGroup[] = [];
  for (const games of groups.values()) {
    if (new Set(games.map((g) => g.platform)).size > 1) {
      result.push({ title: games[0].name, games });
    }
  }
  return result;
}

export function calculatePlatformCounts(ownedGames: OwnedGame[]): Record<string, number> {
  const counts: Record<string, number> = { all: ownedGames.length };
  for (const p of ALL_PLATFORMS) counts[p] = 0;
  for (const g of ownedGames) counts[g.platform] = (counts[g.platform] || 0) + 1;
  return counts;
}

export function calculateEpicCounts(ownedGames: OwnedGame[]): EpicGameCounts {
  const epicGames = ownedGames.filter((g) => g.platform === "epic");
  const withAch = epicGames.filter((g) => g.totalAchievements > 0).length;
  return { total: epicGames.length, withAch, noAch: epicGames.length - withAch };
}
