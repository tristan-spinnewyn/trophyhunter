// components/library/hooks/useCollectionStats.ts

import { useMemo } from "react";
import type { OwnedGame } from "@/lib/types";
import type {
  EpicGameCounts,
} from "@/lib/library/library-stats";
import {
  calculateDuplicateGroups,
  calculatePlatformCounts,
  calculateEpicCounts,
} from "@/lib/library/library-stats";


export function useCollectionStats(ownedGames: OwnedGame[]) {
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
