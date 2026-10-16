// lib/xbox/types.ts

import type { OwnedGame, PlatformAccount } from "@/lib/types";

export interface XboxProfileSyncResult {
  account: PlatformAccount;
  discoveredGames: OwnedGame[];
}

export interface OpenXblProfile {
  id?: string;
  settings?: Array<{ id: string; value: string }>;
}

export interface OpenXblTitle {
  titleId: string;
  name: string;
  image?: string;
  displayImage?: string;
  achievement?: {
    totalAchievements?: number;
    currentAchievements?: number;
  };
}
