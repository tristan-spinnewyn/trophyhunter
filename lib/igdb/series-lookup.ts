// lib/igdb/series-lookup.ts
// Finds the series a game belongs to on IGDB, with every game of it.

import type { GameSeries, SeriesMember } from "@/lib/series/series.types";
import { igdbQuery } from "./igdb-client";

/** IGDB `external_game_source` id of Steam. */
const STEAM_SOURCE = 1;
const MAX_MEMBERS = 100;

interface SeriesGroupRow {
  readonly id: number;
  readonly name: string;
  readonly games?: readonly number[];
}

async function findGroup(igdbGameId: number): Promise<SeriesGroupRow | null> {
  const [game] = await igdbQuery<{ id: number; collections?: number[]; franchises?: number[] }>(
    "games",
    `fields collections,franchises; where id = ${igdbGameId};`
  );
  // A series (collection) is closer kin than a franchise, which may span spin-offs.
  for (const [endpoint, ids] of [["collections", game?.collections], ["franchises", game?.franchises]] as const) {
    if (!ids?.length) continue;
    const [group] = await igdbQuery<SeriesGroupRow>(endpoint, `fields name,games; where id = ${ids[0]};`);
    if (group?.games && group.games.length > 1) return group;
  }
  return null;
}

/** The game's series with its games (main versions only), oldest release first; null when it has none. */
export async function lookupGameSeries(igdbGameId: number): Promise<GameSeries | null> {
  const group = await findGroup(igdbGameId);
  if (!group?.games) return null;

  const ids = group.games.slice(0, MAX_MEMBERS).join(",");
  const games = await igdbQuery<{ id: number; name: string; first_release_date?: number }>(
    "games",
    `fields id,name,first_release_date; where id = (${ids}) & version_parent = null; limit ${MAX_MEMBERS};`
  );
  if (games.length < 2) return null;
  const steamIds = await igdbQuery<{ game: number; uid: string }>(
    "external_games",
    `fields game,uid; where external_game_source = ${STEAM_SOURCE} & game = (${games.map((g) => g.id).join(",")}); limit 500;`
  );
  const steamIdOf = new Map(steamIds.map((row) => [row.game, Number(row.uid)]));

  const members: SeriesMember[] = games
    .map((g) => ({
      igdbGameId: g.id,
      name: g.name,
      releaseDate: g.first_release_date === undefined ? undefined : new Date(g.first_release_date * 1000).toISOString(),
      steamAppId: steamIdOf.get(g.id),
    }))
    .sort((a, b) => (a.releaseDate ?? "9999").localeCompare(b.releaseDate ?? "9999"));
  return { name: group.name, members };
}
