import crypto from "node:crypto";
import { getDb } from "./connection";
import type { PlatformType, UserGameProgress } from "../types";

export function getUserGameProgress(
  userId: string,
  appId: number,
  platform: PlatformType = "steam"
): UserGameProgress | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT unlocked_ids_json, notes_json, last_played
       FROM user_game_progress
       WHERE user_id = ? AND app_id = ? AND platform = ?`
    )
    .get(userId, appId, platform) as
    | {
        unlocked_ids_json: string;
        notes_json: string;
        last_played: string | null;
      }
    | undefined;

  if (!row) return null;

  try {
    return {
      unlockedIds: JSON.parse(row.unlocked_ids_json || "[]"),
      notes: JSON.parse(row.notes_json || "{}"),
      lastPlayed: row.last_played || undefined,
    };
  } catch {
    return null;
  }
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
  ).run(
    crypto.randomUUID(),
    userId,
    appId,
    platform,
    unlockedJson,
    notesJson,
    lastPlayed,
    now
  );

  // Keep user_games unlocked count and last played in sync if game is present
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

export function resetUserGameProgress(
  userId: string,
  appId: number,
  platform: PlatformType = "steam"
): void {
  const db = getDb();
  db.prepare(
    "DELETE FROM user_game_progress WHERE user_id = ? AND app_id = ? AND platform = ?"
  ).run(userId, appId, platform);
  db.prepare(
    "UPDATE user_games SET unlocked_count = 0 WHERE user_id = ? AND app_id = ? AND platform = ?"
  ).run(userId, appId, platform);
}

export function getAllUserGameProgress(
  userId: string
): Record<string, UserGameProgress> {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT app_id, platform, unlocked_ids_json, notes_json, last_played
       FROM user_game_progress WHERE user_id = ?`
    )
    .all(userId) as Array<{
    app_id: number;
    platform: string;
    unlocked_ids_json: string;
    notes_json: string;
    last_played: string | null;
  }>;

  const result: Record<string, UserGameProgress> = {};
  for (const r of rows) {
    try {
      result[`${r.platform}_${r.app_id}`] = {
        unlockedIds: JSON.parse(r.unlocked_ids_json || "[]"),
        notes: JSON.parse(r.notes_json || "{}"),
        lastPlayed: r.last_played || undefined,
      };
    } catch {
      // ignore parse errors
    }
  }
  return result;
}
