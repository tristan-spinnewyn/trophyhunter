// components/library/hooks/useBacklogDurations.ts
"use client";

import { useEffect, useState } from "react";
import type { GameDurations, OwnedGame } from "@/lib/types";
import { resolveGameStatus } from "@/lib/game-status/game-status.services";

type DurationsByGame = Readonly<Record<string, GameDurations>>;

/** How long the backlog games take to beat, keyed `platform_appId`; loaded for signed-in users only. */
export function useBacklogDurations(games: readonly OwnedGame[], isSignedIn: boolean): DurationsByGame {
  const [durations, setDurations] = useState<DurationsByGame>({});
  // Asked again only when the set of backlog games changes.
  const backlogKey = games
    .filter((g) => resolveGameStatus(g.status) === "backlog")
    .map((g) => `${g.platform}_${g.appId}`)
    .sort()
    .join(",");

  useEffect(() => {
    if (!isSignedIn || !backlogKey) return;
    let isCurrent = true;
    fetch("/api/user/time-to-beat")
      .then((res) => (res.ok ? res.json() : { durations: {} }))
      .then((data: { durations?: DurationsByGame }) => {
        if (isCurrent) setDurations(data.durations ?? {});
      })
      .catch(() => {
        if (isCurrent) setDurations({});
      });
    return () => {
      isCurrent = false;
    };
  }, [isSignedIn, backlogKey]);

  return durations;
}
