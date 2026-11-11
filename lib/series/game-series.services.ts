// lib/series/game-series.services.ts
// The series of a game of the collection, from the cache or IGDB, compared with the collection.

import { getCachedSeries, getUserOwnedGames, saveCachedSeries } from "@/lib/db";
import { getStoredTimeToBeat } from "@/lib/db/time-to-beat";
import { isIgdbConfigured } from "@/lib/igdb/igdb-client";
import { igdbTargetKey, resolveIgdbGameIds } from "@/lib/igdb/igdb-game-resolver";
import { lookupGameSeries } from "@/lib/igdb/series-lookup";
import type { GameRef, OwnedGame } from "@/lib/types";
import { matchSeriesMembers } from "./series-matching";
import type { GameSeries, SeriesView } from "./series.types";

const DAY_MS = 86_400_000;
/** Series barely change; a game without one may be added to one sooner. */
const FOUND_TTL_MS = 30 * DAY_MS;
const NONE_TTL_MS = 7 * DAY_MS;

export interface SeriesDependencies {
  readonly resolve?: typeof resolveIgdbGameIds;
  readonly lookup?: typeof lookupGameSeries;
}

async function igdbIdOf(game: OwnedGame, resolve: typeof resolveIgdbGameIds): Promise<number | null> {
  const known = getStoredTimeToBeat([game]).get(igdbTargetKey(game))?.igdbGameId;
  if (known) return known;
  const { ids } = await resolve([{ appId: game.appId, platform: game.platform, name: game.name }]);
  return ids.get(igdbTargetKey(game)) ?? null;
}

async function seriesOf(game: OwnedGame, now: Date, deps: Required<SeriesDependencies>): Promise<GameSeries | null> {
  const cached = getCachedSeries(game);
  if (cached && now.getTime() - Date.parse(cached.fetchedAt) < (cached.series ? FOUND_TTL_MS : NONE_TTL_MS)) return cached.series;

  const igdbId = await igdbIdOf(game, deps.resolve);
  const series = igdbId === null ? null : await deps.lookup(igdbId);
  saveCachedSeries(game, series, now);
  return series;
}

/** The series of a game the user owns, with what the collection holds of it; null when there is none to show. */
export async function getSeriesForGame(
  userId: string,
  ref: GameRef,
  now: Date,
  { resolve = resolveIgdbGameIds, lookup = lookupGameSeries }: SeriesDependencies = {}
): Promise<SeriesView | null> {
  if (!isIgdbConfigured()) return null;
  const owned = getUserOwnedGames(userId);
  const game = owned.find((g) => g.platform === ref.platform && g.appId === ref.appId);
  if (!game) return null;

  const series = await seriesOf(game, now, { resolve, lookup });
  return series ? matchSeriesMembers(series, owned) : null;
}
