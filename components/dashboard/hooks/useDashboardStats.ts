// components/dashboard/hooks/useDashboardStats.ts

import { useMemo } from "react";
import type { OwnedGame, UserAccountProfile } from "@/lib/types";
import type {
  GlobalDashboardStats,
  EpicGameCounts,
  DuplicateGroup,
} from "@/lib/library/library-stats";
import {
  calculateDuplicateGroups,
  calculatePlatformCounts,
  calculateEpicCounts,
  calculateGlobalStats,
} from "@/lib/library/library-stats";


export function useDashboardStats(
  accountProfile: UserAccountProfile,
  ownedGames: OwnedGame[]
) {
  const duplicateGroups = useMemo(
    () => calculateDuplicateGroups(ownedGames),
    [ownedGames]
  );

  const globalStats = useMemo<GlobalDashboardStats>(
    () => calculateGlobalStats(accountProfile, ownedGames),
    [accountProfile, ownedGames]
  );

  const platformCounts = useMemo(
    () => calculatePlatformCounts(ownedGames),
    [ownedGames]
  );

  const epicCounts = useMemo<EpicGameCounts>(
    () => calculateEpicCounts(ownedGames),
    [ownedGames]
  );

  return {
    duplicateGroups,
    globalStats,
    platformCounts,
    epicCounts,
  };
}
