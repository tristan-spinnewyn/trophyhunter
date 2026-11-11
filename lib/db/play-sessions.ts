// lib/db/play-sessions.ts
import type { DatabaseSync } from "node:sqlite";
import { getDb } from "./connection";
import type { OwnedGame, PlatformType, PlaySession } from "../types";
import { isManualPlatform } from "../platforms";

/** Platforms round playtime to a tenth of an hour: anything smaller is noise, not a session. */
const MIN_SESSION_MINUTES = 6;

/**
 * Minutes played between two playtime readings, or null when nothing can be told:
 * a game seen for the first time, an unknown reading, or a counter that did not grow.
 */
export function playtimeGrowthMinutes(
  previousHours: number | null | undefined,
  nextHours: number | null | undefined
): number | null {
  if (previousHours == null || nextHours == null) return null;
  const minutes = Math.round((nextHours - previousHours) * 60);
  return minutes >= MIN_SESSION_MINUTES ? minutes : null;
}

/**
 * The playtime to compare a write against. A game seen for the first time has none (its total is history,
 * not a session). A game already in the collection without playtime starts from zero on a platform timed by hand,
 * where the first hours typed are play, but stays unknown elsewhere, where a store's first report is a lifetime total.
 */
export function previousPlaytimeHours(
  platform: PlatformType,
  storedRow: { readonly playtime_hours: number | null } | undefined
): number | null {
  if (!storedRow) return null;
  return storedRow.playtime_hours ?? (isManualPlatform(platform) ? 0 : null);
}

/** Writes a session when the incoming game carries more playtime than the stored one. */
export function recordPlaytimeGrowth(
  db: DatabaseSync,
  userId: string,
  game: OwnedGame,
  previousHours: number | null
): void {
  const minutes = playtimeGrowthMinutes(previousHours, game.playtimeHours);
  if (minutes === null) return;
  db.prepare(
    `INSERT INTO play_sessions (user_id, platform, app_id, minutes, detected_at, last_played)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(userId, game.platform, game.appId, minutes, new Date().toISOString(), game.lastPlayed || null);
}

interface PlaySessionRow {
  readonly app_id: number;
  readonly platform: string;
  readonly name: string | null;
  readonly header_img: string | null;
  readonly minutes: number;
  readonly detected_at: string;
  readonly last_played: string | null;
}

export interface PlaySessionQuery {
  /** ISO date: only sessions detected at or after it. */
  readonly since?: string;
  readonly limit?: number;
}

/** The user's play sessions, latest first, with the game's name and cover. */
export function getPlaySessions(userId: string, { since, limit }: PlaySessionQuery = {}): PlaySession[] {
  const rows = getDb()
    .prepare(
      `SELECT s.app_id, s.platform, g.name, g.header_img, s.minutes, s.detected_at, s.last_played
       FROM play_sessions s
       LEFT JOIN user_games g ON g.user_id = s.user_id AND g.platform = s.platform AND g.app_id = s.app_id
       WHERE s.user_id = ? AND s.detected_at >= ?
       ORDER BY s.detected_at DESC, s.id DESC
       LIMIT ?`
    )
    .all(userId, since ?? "", limit ?? -1) as unknown as PlaySessionRow[];

  return rows.map((row) => ({
    appId: row.app_id,
    platform: row.platform as PlatformType,
    name: row.name ?? `#${row.app_id}`,
    headerImg: row.header_img ?? undefined,
    minutes: row.minutes,
    detectedAt: row.detected_at,
    lastPlayed: row.last_played ?? undefined,
  }));
}
