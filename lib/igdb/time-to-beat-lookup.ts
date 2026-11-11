// lib/igdb/time-to-beat-lookup.ts
// Finds how long games take to beat on IGDB: by store id where IGDB knows it, by exact name otherwise.

import type { PlatformType } from "@/lib/types";
import { igdbQuery } from "./igdb-client";

export interface TimeToBeatTarget {
  readonly appId: number;
  readonly platform: PlatformType;
  readonly name: string;
}

export interface TimeToBeat {
  readonly igdbGameId: number;
  readonly hastilySeconds: number | null;
  readonly normallySeconds: number | null;
  readonly completelySeconds: number | null;
}

/** IGDB `external_game_source` ids of the stores whose game ids it records. */
const EXTERNAL_SOURCE: Partial<Record<PlatformType, number>> = { steam: 1, gog: 5 };
/** Name searches cost one request each: a call makes at most this many, the rest wait for a later call. */
export const MAX_NAME_LOOKUPS = 8;
/** IGDB allows 4 requests per second. */
const NAME_LOOKUP_SPACING_MS = 260;

interface LookupOptions {
  readonly pause?: () => Promise<void>;
}

const keyOf = (game: Pick<TimeToBeatTarget, "appId" | "platform">) => `${game.platform}_${game.appId}`;
const wait = () => new Promise<void>((resolve) => setTimeout(resolve, NAME_LOOKUP_SPACING_MS));
const normalizeName = (name: string) => name.replace(/[™®©]/g, "").replace(/\s+/g, " ").trim().toLowerCase();

async function findByStoreId(games: readonly TimeToBeatTarget[], ids: Map<string, number>): Promise<void> {
  for (const [platform, source] of Object.entries(EXTERNAL_SOURCE)) {
    const onStore = games.filter((g) => g.platform === platform);
    if (onStore.length === 0) continue;
    const uids = onStore.map((g) => `"${g.appId}"`).join(",");
    const rows = await igdbQuery<{ game: number; uid: string }>(
      "external_games",
      `fields game,uid,external_game_source; where external_game_source = ${source} & uid = (${uids}); limit 500;`
    );
    for (const row of rows) ids.set(`${platform}_${row.uid}`, row.game);
  }
}

async function findByName(game: TimeToBeatTarget): Promise<number | null> {
  const escaped = game.name.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const rows = await igdbQuery<{ id: number; name: string }>(
    "games",
    `search "${escaped}"; fields id,name; where version_parent = null; limit 10;`
  );
  const wanted = normalizeName(game.name);
  return rows.find((row) => normalizeName(row.name) === wanted)?.id ?? null;
}

/**
 * Durations of the given games, keyed `platform_appId`: null for a game IGDB does not know.
 * A game left out of the result was not looked up yet (too many names to search in one call).
 */
export async function lookupTimeToBeat(
  games: readonly TimeToBeatTarget[],
  { pause = wait }: LookupOptions = {}
): Promise<Map<string, TimeToBeat | null>> {
  const ids = new Map<string, number>();
  const looked = new Set<string>();
  await findByStoreId(games, ids);

  const byName = games.filter((g) => !ids.has(keyOf(g))).slice(0, MAX_NAME_LOOKUPS);
  for (const game of games) if (ids.has(keyOf(game))) looked.add(keyOf(game));
  for (const game of byName) {
    await pause();
    const id = await findByName(game);
    if (id !== null) ids.set(keyOf(game), id);
    looked.add(keyOf(game));
  }

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
