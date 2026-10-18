// lib/db/progress-mapper.ts
import type { UserGameProgress } from "../types";
import { normalizePinnedIds } from "../hunting/pinned-targets.services";
import { sanitizeHuntingOverrideSafe } from "../hunting/hunting-override.services";

export interface ProgressRow {
  app_id: number;
  platform: string;
  unlocked_ids_json: string;
  notes_json: string;
  pinned_ids_json?: string | null;
  hunting_meta_json?: string | null;
  last_played: string | null;
}

export function parseProgressRow(
  row: Pick<
    ProgressRow,
    | "unlocked_ids_json"
    | "notes_json"
    | "pinned_ids_json"
    | "hunting_meta_json"
    | "last_played"
  >
): UserGameProgress {
  try {
    const pinnedIds = row.pinned_ids_json
      ? normalizePinnedIds(JSON.parse(row.pinned_ids_json))
      : [];
    const huntingMeta = row.hunting_meta_json
      ? sanitizeHuntingOverrideSafe(JSON.parse(row.hunting_meta_json))
      : undefined;

    return {
      unlockedIds: JSON.parse(row.unlocked_ids_json || "[]"),
      notes: JSON.parse(row.notes_json || "{}"),
      pinnedIds,
      ...(huntingMeta ? { huntingMeta } : {}),
      lastPlayed: row.last_played || undefined,
    };
  } catch {
    return { unlockedIds: [], notes: {}, pinnedIds: [] };
  }
}
