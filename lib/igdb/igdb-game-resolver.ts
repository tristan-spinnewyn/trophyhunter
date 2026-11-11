// lib/igdb/igdb-game-resolver.ts
// Finds which IGDB game a collection or wishlist game is: by store id where IGDB knows it, by exact name otherwise.

import type { PlatformType } from "@/lib/types";
import { igdbQuery } from "./igdb-client";

export interface IgdbGameTarget {
  readonly appId: number;
  readonly platform: PlatformType;
  readonly name: string;
}

export interface ResolveOptions {
  readonly pause?: () => Promise<void>;
}

export interface ResolvedIgdbGames {
  /** IGDB game id per `platform_appId`, for the games IGDB knows. */
  readonly ids: ReadonlyMap<string, number>;
  /** Every game looked up in this call, known or not; the others wait for a later call. */
  readonly looked: ReadonlySet<string>;
}

/** IGDB `external_game_source` ids of the stores whose game ids it records. */
const EXTERNAL_SOURCE: Partial<Record<PlatformType, number>> = { steam: 1, gog: 5 };
/** Name searches cost one request each: a call makes at most this many, the rest wait for a later call. */
export const MAX_NAME_LOOKUPS = 8;
/** IGDB allows 4 requests per second. */
const NAME_LOOKUP_SPACING_MS = 260;

export const igdbTargetKey = (game: Pick<IgdbGameTarget, "appId" | "platform">) => `${game.platform}_${game.appId}`;
const wait = () => new Promise<void>((resolve) => setTimeout(resolve, NAME_LOOKUP_SPACING_MS));
const normalizeName = (name: string) => name.replace(/[™®©]/g, "").replace(/\s+/g, " ").trim().toLowerCase();

async function findByStoreId(games: readonly IgdbGameTarget[], ids: Map<string, number>): Promise<void> {
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

async function findByName(game: IgdbGameTarget): Promise<number | null> {
  const escaped = game.name.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const rows = await igdbQuery<{ id: number; name: string }>(
    "games",
    `search "${escaped}"; fields id,name; where version_parent = null; limit 10;`
  );
  const wanted = normalizeName(game.name);
  return rows.find((row) => normalizeName(row.name) === wanted)?.id ?? null;
}

/** The IGDB ids of the given games; only a few names are searched per call, pausing between them. */
export async function resolveIgdbGameIds(
  games: readonly IgdbGameTarget[],
  { pause = wait }: ResolveOptions = {}
): Promise<ResolvedIgdbGames> {
  const ids = new Map<string, number>();
  const looked = new Set<string>();
  await findByStoreId(games, ids);

  const byName = games.filter((g) => !ids.has(igdbTargetKey(g))).slice(0, MAX_NAME_LOOKUPS);
  for (const game of games) if (ids.has(igdbTargetKey(game))) looked.add(igdbTargetKey(game));
  for (const game of byName) {
    await pause();
    const id = await findByName(game);
    if (id !== null) ids.set(igdbTargetKey(game), id);
    looked.add(igdbTargetKey(game));
  }
  return { ids, looked };
}
