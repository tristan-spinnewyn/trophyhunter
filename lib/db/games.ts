// lib/db/games.ts
import crypto from "node:crypto";
import { getDb, withTransaction } from "./connection";
import type { OwnedGame, PlatformType } from "../types";
import { isValidGameStatus } from "../game-status/game-status.services";
import { mapUserGameRow, type UserGameRow } from "./games-mapper";
import { previousPlaytimeHours, recordPlaytimeGrowth } from "./play-sessions";

export function getUserOwnedGames(userId: string): OwnedGame[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT g.app_id, g.name, g.header_img, g.platform, g.total_achievements, g.unlocked_count, g.playtime_hours, g.last_played, g.added_at, g.source, g.status, g.backlog_rank, g.status_changed_at, g.completed_at, g.abandoned_at, g.rating, g.review, g.resume_note,
              l.primary_platform, l.primary_app_id
       FROM user_games g
       LEFT JOIN game_links l ON l.user_id = g.user_id AND l.platform = g.platform AND l.app_id = g.app_id
       WHERE g.user_id = ?
       ORDER BY g.added_at DESC`
    )
    .all(userId) as unknown as UserGameRow[];

  return rows.map(mapUserGameRow);
}

export function saveUserOwnedGames(userId: string, games: OwnedGame[]): void {
  if (!games.length) return;
  const db = getDb();

  const insertStmt = db.prepare(
    `INSERT INTO user_games (id, user_id, app_id, platform, name, header_img, total_achievements, unlocked_count, playtime_hours, last_played, source, status, added_at, backlog_rank, status_changed_at, completed_at, abandoned_at, rating, review, resume_note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, 'unsorted'), ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, platform, app_id) DO UPDATE SET
       name = excluded.name,
       header_img = COALESCE(excluded.header_img, user_games.header_img),
       total_achievements = CASE WHEN excluded.total_achievements > 0 THEN excluded.total_achievements ELSE user_games.total_achievements END,
       unlocked_count = MAX(excluded.unlocked_count, user_games.unlocked_count),
       playtime_hours = COALESCE(excluded.playtime_hours, user_games.playtime_hours),
       last_played = CASE
         WHEN excluded.last_played IS NULL THEN user_games.last_played
         WHEN user_games.last_played IS NULL THEN excluded.last_played
         ELSE MAX(excluded.last_played, user_games.last_played)
       END,
       source = COALESCE(excluded.source, user_games.source),
       backlog_rank = COALESCE(excluded.backlog_rank, user_games.backlog_rank),
       status_changed_at = COALESCE(excluded.status_changed_at, user_games.status_changed_at),
       completed_at = COALESCE(excluded.completed_at, user_games.completed_at),
       abandoned_at = COALESCE(excluded.abandoned_at, user_games.abandoned_at),
       rating = COALESCE(excluded.rating, user_games.rating),
       review = COALESCE(excluded.review, user_games.review),
       resume_note = COALESCE(excluded.resume_note, user_games.resume_note),
       status = COALESCE(?, user_games.status)`
  );

  const previousPlaytimeStmt = db.prepare(
    "SELECT playtime_hours FROM user_games WHERE user_id = ? AND platform = ? AND app_id = ?"
  );

  withTransaction(db, () => {
    for (const g of games) {
      const previous = previousPlaytimeStmt.get(userId, g.platform, g.appId) as
        | { playtime_hours: number | null }
        | undefined;
      recordPlaytimeGrowth(db, userId, g, previousPlaytimeHours(g.platform, previous));
      const explicitStatus = isValidGameStatus(g.status) ? g.status : null;
      insertStmt.run(
        crypto.randomUUID(),
        userId,
        g.appId,
        g.platform,
        g.name,
        g.headerImg || null,
        g.totalAchievements || 0,
        g.unlockedCount || 0,
        g.playtimeHours ?? null,
        g.lastPlayed || null,
        g.source || null,
        explicitStatus,
        g.addedAt || new Date().toISOString(),
        Number.isInteger(g.backlogRank) ? (g.backlogRank as number) : null,
        g.statusChangedAt || null,
        g.completedAt || null,
        g.abandonedAt || null,
        g.rating ?? null,
        g.review || null,
        g.resumeNote || null,
        explicitStatus
      );
    }
  });
}

export function removeUserPlatformGames(userId: string, platform: PlatformType): void {
  const db = getDb();
  db.prepare("DELETE FROM user_games WHERE user_id = ? AND platform = ?").run(userId, platform);
}

export function removeUserOwnedGame(userId: string, appId: number, platform?: PlatformType): void {
  const db = getDb();
  if (platform) {
    db.prepare("DELETE FROM user_games WHERE user_id = ? AND app_id = ? AND platform = ?").run(userId, appId, platform);
    db.prepare("DELETE FROM user_game_progress WHERE user_id = ? AND app_id = ? AND platform = ?").run(userId, appId, platform);
  } else {
    db.prepare("DELETE FROM user_games WHERE user_id = ? AND app_id = ?").run(userId, appId);
    db.prepare("DELETE FROM user_game_progress WHERE user_id = ? AND app_id = ?").run(userId, appId);
  }
}
