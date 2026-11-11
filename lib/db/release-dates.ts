// lib/db/release-dates.ts
import { getDb, withTransaction } from "./connection";
import type { PlatformType } from "../types";

const DAY_MS = 86_400_000;
/** A coming or unknown release may move or be announced: asked again weekly. */
const UPCOMING_TTL_MS = 7 * DAY_MS;
/** A past release barely changes. */
const RELEASED_TTL_MS = 90 * DAY_MS;

export interface ReleaseCheck {
  readonly appId: number;
  readonly platform: PlatformType;
  readonly name: string;
}

export interface StoredReleaseDate {
  readonly igdbGameId: number;
  readonly releaseDate: string | null;
}

interface DueRow {
  readonly app_id: number;
  readonly platform: PlatformType;
  readonly name: string;
  readonly release_date: string | null;
  readonly fetched_at: string | null;
}

function isDue(row: DueRow, now: number): boolean {
  if (!row.fetched_at) return true;
  const isReleased = row.release_date !== null && Date.parse(row.release_date) < now;
  return now - Date.parse(row.fetched_at) >= (isReleased ? RELEASED_TTL_MS : UPCOMING_TTL_MS);
}

/** Wished games (once each, whoever wishes them) whose release date is missing or stale, never-checked first. */
export function listWishlistReleaseChecksDue(now: Date, limit: number): ReleaseCheck[] {
  const rows = getDb()
    .prepare(
      `SELECT w.app_id, w.platform, MIN(w.name) AS name, r.release_date, r.fetched_at
       FROM user_wishlist w
       LEFT JOIN game_release_dates r ON r.platform = w.platform AND r.app_id = w.app_id
       GROUP BY w.platform, w.app_id
       ORDER BY r.fetched_at IS NOT NULL, r.fetched_at, w.app_id`
    )
    .all() as unknown as DueRow[];
  return rows
    .filter((row) => isDue(row, now.getTime()))
    .slice(0, limit)
    .map(({ app_id, platform, name }) => ({ appId: app_id, platform, name }));
}

/** Stores looked-up release dates keyed `platform_appId`; null records a game IGDB does not know. */
export function saveReleaseDates(entries: ReadonlyMap<string, StoredReleaseDate | null>, fetchedAt: Date): void {
  const db = getDb();
  const stmt = db.prepare(
    `INSERT INTO game_release_dates (platform, app_id, igdb_game_id, release_date, fetched_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(platform, app_id) DO UPDATE SET
       igdb_game_id = excluded.igdb_game_id,
       release_date = excluded.release_date,
       fetched_at = excluded.fetched_at`
  );
  withTransaction(db, () => {
    for (const [key, entry] of entries) {
      const separator = key.lastIndexOf("_");
      stmt.run(key.slice(0, separator), Number(key.slice(separator + 1)), entry?.igdbGameId ?? null, entry?.releaseDate ?? null, fetchedAt.toISOString());
    }
  });
}
