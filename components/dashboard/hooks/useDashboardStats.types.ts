// components/dashboard/hooks/useDashboardStats.types.ts

import type { OwnedGame } from "@/lib/types";

export interface GlobalDashboardStats {
  readonly connectedCount: number;
  readonly totalGamesOwned: number;
  readonly totalAchievementsUnlocked: number;
  readonly totalCompletedGames: number;
  readonly totalHours: number;
  readonly avgCompletion: number;
  readonly trackedGamesCount: number;
  readonly finishedGamesCount: number;
  readonly finishedGamesPercent: number;
}

export interface EpicGameCounts {
  readonly total: number;
  readonly withAch: number;
  readonly noAch: number;
}

export interface DuplicateGroup {
  readonly title: string;
  readonly games: OwnedGame[];
}
