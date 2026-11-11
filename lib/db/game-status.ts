// lib/db/game-status.ts
import crypto from "node:crypto";
import { getDb } from "./connection";
import type { GameStatus, PlatformType } from "../types";
import {
  assertValidGameStatus,
  resolveGameStatus,
} from "../game-status/game-status.services";

export function setUserGameStatus(
  userId: string,
  appId: number,
  platform: PlatformType,
  status: GameStatus,
  fallbackName?: string
): void {
  const validStatus = assertValidGameStatus(status);
  const db = getDb();
  const changedAt = new Date().toISOString();
  const existing = db
    .prepare("SELECT id FROM user_games WHERE user_id = ? AND app_id = ? AND platform = ?")
    .get(userId, appId, platform) as { readonly id: string } | undefined;

  if (existing) {
    // A game that leaves the backlog also leaves its queue. A game picked up again keeps its last finish date.
    db.prepare(
      `UPDATE user_games
       SET status = ?, status_changed_at = ?,
           backlog_rank = CASE WHEN ? = 'backlog' THEN backlog_rank ELSE NULL END,
           completed_at = CASE WHEN ? = 'completed' THEN ? ELSE completed_at END
       WHERE user_id = ? AND app_id = ? AND platform = ?`
    ).run(validStatus, changedAt, validStatus, validStatus, changedAt, userId, appId, platform);
  } else {
    db.prepare(
      `INSERT INTO user_games (id, user_id, app_id, platform, name, status, added_at, status_changed_at, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      crypto.randomUUID(),
      userId,
      appId,
      platform,
      fallbackName || `Game ${appId}`,
      validStatus,
      changedAt,
      changedAt,
      validStatus === "completed" ? changedAt : null
    );
  }
}

export function getUserGameStatus(
  userId: string,
  appId: number,
  platform: PlatformType
): GameStatus {
  const db = getDb();
  const row = db
    .prepare("SELECT status FROM user_games WHERE user_id = ? AND app_id = ? AND platform = ?")
    .get(userId, appId, platform) as { readonly status?: string | null } | undefined;

  return resolveGameStatus(row?.status);
}
