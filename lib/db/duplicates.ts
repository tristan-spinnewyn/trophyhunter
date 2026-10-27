// lib/db/duplicates.ts
import { getUserOwnedGames } from "./games";
import type { DuplicateGameGroup, OwnedGame } from "../types";
import { normalizeGameTitle } from "../game-title";

export function getUserDuplicateGames(userId: string): DuplicateGameGroup[] {
  const games = getUserOwnedGames(userId);
  const groups = new Map<string, OwnedGame[]>();

  for (const game of games) {
    const norm = normalizeGameTitle(game.name);
    if (!norm) continue;
    const existing = groups.get(norm) || [];
    existing.push(game);
    groups.set(norm, existing);
  }

  const duplicates: DuplicateGameGroup[] = [];
  for (const [normTitle, list] of groups.entries()) {
    const platforms = new Set(list.map((g) => g.platform));
    if (platforms.size > 1) {
      duplicates.push({
        normalizedTitle: normTitle,
        games: list,
      });
    }
  }

  return duplicates;
}
