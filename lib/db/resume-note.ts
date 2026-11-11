// lib/db/resume-note.ts
import { getDb } from "./connection";
import type { PlatformType } from "../types";

/** Sets (or clears, with null) where the owner left off in a game; false when the game is not in the collection. */
export function setUserGameResumeNote(userId: string, appId: number, platform: PlatformType, note: string | null): boolean {
  const result = getDb()
    .prepare("UPDATE user_games SET resume_note = ? WHERE user_id = ? AND app_id = ? AND platform = ?")
    .run(note, userId, appId, platform);
  return Number(result.changes) > 0;
}
