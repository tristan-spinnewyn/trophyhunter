// lib/igdb/time-to-beat-lookup.ts
// Finds how long games take to beat on IGDB, once each game is matched to its IGDB entry.

import { igdbQuery } from "./igdb-client";
import { resolveIgdbGameIds, type IgdbGameTarget, type ResolveOptions } from "./igdb-game-resolver";

export { MAX_NAME_LOOKUPS } from "./igdb-game-resolver";
export type TimeToBeatTarget = IgdbGameTarget;

export interface TimeToBeat {
  readonly igdbGameId: number;
  readonly hastilySeconds: number | null;
  readonly normallySeconds: number | null;
  readonly completelySeconds: number | null;
}

/**
 * Durations of the given games, keyed `platform_appId`: null for a game IGDB does not know.
 * A game left out of the result was not looked up yet (too many names to search in one call).
 */
export async function lookupTimeToBeat(
  games: readonly TimeToBeatTarget[],
  options: ResolveOptions = {}
): Promise<Map<string, TimeToBeat | null>> {
  const { ids, looked } = await resolveIgdbGameIds(games, options);

  const gameIds = [...new Set(ids.values())];
  const durations = new Map<number, Omit<TimeToBeat, "igdbGameId">>();
  if (gameIds.length > 0) {
    const rows = await igdbQuery<{ game_id: number; hastily?: number; normally?: number; completely?: number }>(
      "game_time_to_beats",
      `fields game_id,hastily,normally,completely; where game_id = (${gameIds.join(",")}); limit 500;`
    );
    for (const row of rows) {
      durations.set(row.game_id, {
        hastilySeconds: row.hastily ?? null,
        normallySeconds: row.normally ?? null,
        completelySeconds: row.completely ?? null,
      });
    }
  }

  const result = new Map<string, TimeToBeat | null>();
  for (const key of looked) {
    const igdbGameId = ids.get(key);
    result.set(
      key,
      igdbGameId === undefined
        ? null
        : { igdbGameId, ...(durations.get(igdbGameId) ?? { hastilySeconds: null, normallySeconds: null, completelySeconds: null }) }
    );
  }
  return result;
}
