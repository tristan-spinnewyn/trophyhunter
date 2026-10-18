// lib/db/games.ts
import crypto from "node:crypto";
import { getDb, withTransaction } from "./connection";
import type { OwnedGame, PlatformType } from "../types";
import { isValidGameStatus } from "../game-status/game-status.services";
import { mapUserGameRow, type UserGameRow } from "./games-mapper";

export function getUserOwnedGames(userId: string): OwnedGame[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT app_id, name, header_img, platform, total_achievements, unlocked_count, playtime_hours, last_played, added_at, source, status
       FROM user_games
       WHERE user_id = ?
       ORDER BY added_at DESC`
    )
    .all(userId) as unknown as UserGameRow[];

  return rows.map(mapUserGameRow);
}

export function saveUserOwnedGames(userId: string, games: OwnedGame[]): void {
  if (!games.length) return;
  const db = getDb();

  const insertStmt = db.prepare(
    `INSERT INTO user_games (id, user_id, app_id, platform, name, header_img, total_achievements, unlocked_count, playtime_hours, last_played, source, status, added_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, 'backlog'), ?)
     ON CONFLICT(user_id, platform, app_id) DO UPDATE SET
       name = excluded.name,
       header_img = COALESCE(excluded.header_img, user_games.header_img),
       total_achievements = CASE WHEN excluded.total_achievements > 0 THEN excluded.total_achievements ELSE user_games.total_achievements END,
       unlocked_count = MAX(excluded.unlocked_count, user_games.unlocked_count),
       playtime_hours = COALESCE(excluded.playtime_hours, user_games.playtime_hours),
       last_played = COALESCE(excluded.last_played, user_games.last_played),
       source = COALESCE(excluded.source, user_games.source),
       status = COALESCE(?, user_games.status)`
  );

  withTransaction(db, () => {
    for (const g of games) {
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
