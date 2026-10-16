// lib/db/progress.ts
import crypto from "node:crypto";
import { getDb } from "./connection";
import type { PlatformType, UserGameProgress } from "../types";
import { parseProgressRow, type ProgressRow } from "./progress-mapper";

export function getUserGameProgress(userId: string, appId: number, platform: PlatformType = "steam"): UserGameProgress | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT unlocked_ids_json, notes_json, last_played
       FROM user_game_progress
       WHERE user_id = ? AND app_id = ? AND platform = ?`
    )
    .get(userId, appId, platform) as unknown as ProgressRow | undefined;

  if (!row) return null;
  return parseProgressRow(row);
}

export function saveUserGameProgress(
  userId: string,
  appId: number,
  platform: PlatformType,
  progress: UserGameProgress
): void {
  const db = getDb();
  const now = new Date().toISOString();
  const unlockedJson = JSON.stringify(progress.unlockedIds || []);
  const notesJson = JSON.stringify(progress.notes || {});
  const lastPlayed = progress.lastPlayed || now;

  db.prepare(
    `INSERT INTO user_game_progress (id, user_id, app_id, platform, unlocked_ids_json, notes_json, last_played, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, platform, app_id) DO UPDATE SET
       unlocked_ids_json = excluded.unlocked_ids_json,
       notes_json = excluded.notes_json,
       last_played = excluded.last_played,
       updated_at = excluded.updated_at`
  ).run(crypto.randomUUID(), userId, appId, platform, unlockedJson, notesJson, lastPlayed, now);

  try {
    db.prepare(
      `UPDATE user_games
       SET unlocked_count = ?, last_played = ?
       WHERE user_id = ? AND app_id = ? AND platform = ?`
    ).run(progress.unlockedIds?.length || 0, lastPlayed, userId, appId, platform);
  } catch {
    // Non-fatal if game is not yet in user_games
  }
}

export function resetUserGameProgress(userId: string, appId: number, platform: PlatformType = "steam"): void {
  const db = getDb();
  db.prepare("DELETE FROM user_game_progress WHERE user_id = ? AND app_id = ? AND platform = ?").run(userId, appId, platform);
  db.prepare("UPDATE user_games SET unlocked_count = 0 WHERE user_id = ? AND app_id = ? AND platform = ?").run(userId, appId, platform);
}

export function getAllUserGameProgress(userId: string): Record<string, UserGameProgress> {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT app_id, platform, unlocked_ids_json, notes_json, last_played
       FROM user_game_progress WHERE user_id = ?`
    )
    .all(userId) as unknown as ProgressRow[];

  const result: Record<string, UserGameProgress> = {};
  for (const r of rows) {
    result[`${r.platform}_${r.app_id}`] = parseProgressRow(r);
  }
  return result;
}
