// components/library/triage/useTriageQueue.ts

import { useState } from "react";
import type { OwnedGame } from "@/lib/types";

/**
 * Walks through the pile of games to sort. The pile is frozen when sorting starts:
 * sorted games leave the unsorted shelf, which must not reshuffle what comes next.
 */
export function useTriageQueue(games: readonly OwnedGame[]) {
  const [pile] = useState(() => [...games]);
  const [index, setIndex] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);

  const next = () => setIndex((i) => Math.min(i + 1, pile.length));

  return {
    current: pile[index] as OwnedGame | undefined,
    position: index + 1,
    total: pile.length,
    sortedCount: index - skippedCount,
    skippedCount,
    markSorted: next,
    skip: () => {
      if (index >= pile.length) return;
      setSkippedCount((n) => n + 1);
      next();
    },
  };
}
