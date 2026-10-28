// components/dashboard/hooks/useDashboardStats.ts

import { useMemo } from "react";
import type { OwnedGame } from "@/lib/types";
import type {
  EpicGameCounts,
  DuplicateGroup,
} from "@/lib/library/library-stats";
import {
  calculateDuplicateGroups,
  calculatePlatformCounts,
  calculateEpicCounts,
} from "@/lib/library/library-stats";


export function useDashboardStats(ownedGames: OwnedGame[]) {
  const duplicateGroups = useMemo(
    () => calculateDuplicateGroups(ownedGames),
    [ownedGames]
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
    platformCounts,
    epicCounts,
  };
}
