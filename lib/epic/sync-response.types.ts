// lib/epic/sync-response.types.ts
// Client-safe shape of `/api/sync?platform=epic` answers, read by the collection and the game page.

import type { Achievement } from "@/lib/types";

export interface EpicSyncResponseData {
  readonly success?: boolean;
  readonly requiresToken?: boolean;
  readonly error?: string;
  readonly count?: number;
  readonly unlockedCount?: number;
  readonly totalAchievements?: number;
  readonly achievements?: Achievement[];
  readonly unlockedTitles?: string[];
  readonly unlockedIds?: string[];
}
