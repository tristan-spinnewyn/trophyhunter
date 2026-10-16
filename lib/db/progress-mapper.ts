// lib/db/progress-mapper.ts
import type { UserGameProgress } from "../types";

export interface ProgressRow {
  app_id: number;
  platform: string;
  unlocked_ids_json: string;
  notes_json: string;
  last_played: string | null;
}

export function parseProgressRow(row: Pick<ProgressRow, "unlocked_ids_json" | "notes_json" | "last_played">): UserGameProgress {
  try {
    return {
      unlockedIds: JSON.parse(row.unlocked_ids_json || "[]"),
      notes: JSON.parse(row.notes_json || "{}"),
      lastPlayed: row.last_played || undefined,
    };
  } catch {
    return { unlockedIds: [], notes: {} };
  }
}
