// lib/db/series-cache.ts
import { getDb } from "./connection";
import type { GameRef } from "../types";
import type { GameSeries } from "../series/series.types";

export interface CachedSeries {
  /** Null when IGDB knows no series for the game. */
  readonly series: GameSeries | null;
  readonly fetchedAt: string;
}

export function getCachedSeries({ platform, appId }: GameRef): CachedSeries | undefined {
  const row = getDb()
    .prepare("SELECT series_json, fetched_at FROM game_series_cache WHERE platform = ? AND app_id = ?")
    .get(platform, appId) as { series_json: string | null; fetched_at: string } | undefined;
  if (!row) return undefined;
  return { series: row.series_json ? (JSON.parse(row.series_json) as GameSeries) : null, fetchedAt: row.fetched_at };
}

export function saveCachedSeries({ platform, appId }: GameRef, series: GameSeries | null, fetchedAt: Date): void {
  getDb()
    .prepare(
      `INSERT INTO game_series_cache (platform, app_id, series_json, fetched_at) VALUES (?, ?, ?, ?)
       ON CONFLICT(platform, app_id) DO UPDATE SET series_json = excluded.series_json, fetched_at = excluded.fetched_at`
    )
    .run(platform, appId, series ? JSON.stringify(series) : null, fetchedAt.toISOString());
}
