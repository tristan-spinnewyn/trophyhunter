// components/dashboard/hooks/useDashboardStats.types.ts

import type { OwnedGame } from "@/lib/types";

export interface GlobalDashboardStats {
  connectedCount: number;
  totalGamesOwned: number;
  totalAchievementsUnlocked: number;
  totalCompletedGames: number;
  totalHours: number;
  avgCompletion: number;
  trackedGamesCount: number;
}

export interface EpicGameCounts {
  total: number;
  withAch: number;
  noAch: number;
}

export interface DuplicateGroup {
  title: string;
  games: OwnedGame[];
}
