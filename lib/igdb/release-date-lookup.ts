// lib/igdb/release-date-lookup.ts
// Finds when games come out on IGDB, once each game is matched to its IGDB entry.

import { igdbQuery } from "./igdb-client";
import { resolveIgdbGameIds, type IgdbGameTarget, type ResolveOptions } from "./igdb-game-resolver";

export interface ReleaseDate {
  readonly igdbGameId: number;
  /** First release date (ISO), or null when IGDB has none yet. */
  readonly releaseDate: string | null;
}

/**
 * Release dates of the given games, keyed `platform_appId`: null for a game IGDB does not know.
 * A game left out of the result was not looked up yet (too many names to search in one call).
 */
export async function lookupReleaseDates(
  games: readonly IgdbGameTarget[],
  options: ResolveOptions = {}
): Promise<Map<string, ReleaseDate | null>> {
  if (games.length === 0) return new Map();
  const { ids, looked } = await resolveIgdbGameIds(games, options);

  const gameIds = [...new Set(ids.values())];
  const dates = new Map<number, string | null>();
  if (gameIds.length > 0) {
    const rows = await igdbQuery<{ id: number; first_release_date?: number }>(
      "games",
      `fields id,first_release_date; where id = (${gameIds.join(",")}); limit 500;`
    );
    for (const row of rows) {
      dates.set(row.id, row.first_release_date === undefined ? null : new Date(row.first_release_date * 1000).toISOString());
    }
  }

  const result = new Map<string, ReleaseDate | null>();
  for (const key of looked) {
    const igdbGameId = ids.get(key);
    result.set(key, igdbGameId === undefined ? null : { igdbGameId, releaseDate: dates.get(igdbGameId) ?? null });
  }
  return result;
}
