// lib/db/time-to-beat.ts
import { getDb, withTransaction } from "./connection";
import type { PlatformType } from "../types";

export interface StoredTimeToBeat {
  /** Null when IGDB does not know the game. */
  readonly igdbGameId: number | null;
  readonly hastilySeconds: number | null;
  readonly normallySeconds: number | null;
  readonly completelySeconds: number | null;
  readonly fetchedAt: string;
}

interface TimeToBeatRow {
  readonly platform: PlatformType;
  readonly app_id: number;
  readonly igdb_game_id: number | null;
  readonly hastily_seconds: number | null;
  readonly normally_seconds: number | null;
  readonly completely_seconds: number | null;
  readonly fetched_at: string;
}

/** Cached durations of the given games, keyed `platform_appId`. */
export function getStoredTimeToBeat(games: readonly { appId: number; platform: PlatformType }[]): Map<string, StoredTimeToBeat> {
  const stmt = getDb().prepare("SELECT * FROM game_time_to_beat WHERE platform = ? AND app_id = ?");
  const stored = new Map<string, StoredTimeToBeat>();
  for (const game of games) {
    const row = stmt.get(game.platform, game.appId) as TimeToBeatRow | undefined;
    if (!row) continue;
    stored.set(`${row.platform}_${row.app_id}`, {
      igdbGameId: row.igdb_game_id,
      hastilySeconds: row.hastily_seconds,
      normallySeconds: row.normally_seconds,
      completelySeconds: row.completely_seconds,
      fetchedAt: row.fetched_at,
    });
  }
  return stored;
}

export function saveTimeToBeat(entries: ReadonlyMap<string, Omit<StoredTimeToBeat, "fetchedAt">>, fetchedAt: string): void {
  const db = getDb();
  const stmt = db.prepare(
    `INSERT INTO game_time_to_beat (platform, app_id, igdb_game_id, hastily_seconds, normally_seconds, completely_seconds, fetched_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(platform, app_id) DO UPDATE SET
       igdb_game_id = excluded.igdb_game_id,
       hastily_seconds = excluded.hastily_seconds,
       normally_seconds = excluded.normally_seconds,
       completely_seconds = excluded.completely_seconds,
       fetched_at = excluded.fetched_at`
  );
  withTransaction(db, () => {
    for (const [key, entry] of entries) {
      const separator = key.lastIndexOf("_");
      stmt.run(
        key.slice(0, separator),
        Number(key.slice(separator + 1)),
        entry.igdbGameId,
        entry.hastilySeconds,
        entry.normallySeconds,
        entry.completelySeconds,
        fetchedAt
      );
    }
  });
}
