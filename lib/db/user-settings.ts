// lib/db/user-settings.ts
import { getDb } from "./connection";
import type { UserSettings } from "../types";

export const DEFAULT_USER_SETTINGS: UserSettings = { autoSyncHours: null, staleAfterWeeks: 6 };

interface UserSettingsRow {
  readonly auto_sync_hours: number | null;
  readonly stale_after_weeks: number;
}

export function getUserSettings(userId: string): UserSettings {
  const row = getDb()
    .prepare("SELECT auto_sync_hours, stale_after_weeks FROM user_settings WHERE user_id = ?")
    .get(userId) as UserSettingsRow | undefined;
  if (!row) return DEFAULT_USER_SETTINGS;
  return { autoSyncHours: row.auto_sync_hours, staleAfterWeeks: row.stale_after_weeks };
}

/** Saves the given settings; the ones left out keep their current value. */
export function saveUserSettings(userId: string, changes: Partial<UserSettings>): UserSettings {
  const next = { ...getUserSettings(userId), ...changes };
  getDb()
    .prepare(
      `INSERT INTO user_settings (user_id, auto_sync_hours, stale_after_weeks, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         auto_sync_hours = excluded.auto_sync_hours,
         stale_after_weeks = excluded.stale_after_weeks,
         updated_at = excluded.updated_at`
    )
    .run(userId, next.autoSyncHours, next.staleAfterWeeks, new Date().toISOString());
  return next;
}

export function markAutoSyncRun(userId: string, at: Date): void {
  getDb().prepare("UPDATE user_settings SET last_auto_sync_at = ? WHERE user_id = ?").run(at.toISOString(), userId);
}

/** Users with the automatic sync on whose last run is older than their interval, or who never had one. */
export function listUsersDueForAutoSync(now: Date): string[] {
  const rows = getDb()
    .prepare(
      `SELECT user_id, auto_sync_hours, last_auto_sync_at FROM user_settings WHERE auto_sync_hours IS NOT NULL`
    )
    .all() as Array<{ user_id: string; auto_sync_hours: number; last_auto_sync_at: string | null }>;
  return rows
    .filter((r) => !r.last_auto_sync_at || Date.parse(r.last_auto_sync_at) <= now.getTime() - r.auto_sync_hours * 3_600_000)
    .map((r) => r.user_id);
}
