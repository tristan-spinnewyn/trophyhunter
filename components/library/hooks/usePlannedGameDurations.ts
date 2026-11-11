// components/library/hooks/usePlannedGameDurations.ts
"use client";

import { useEffect, useState } from "react";
import type { GameDurations, OwnedGame } from "@/lib/types";
import { isPlannedGame } from "@/lib/library/planned-games";

type DurationsByGame = Readonly<Record<string, GameDurations>>;

/** How long the backlog, in-progress and paused games take to beat, keyed `platform_appId`; loaded for signed-in users only. */
export function usePlannedGameDurations(games: readonly OwnedGame[], isSignedIn: boolean): DurationsByGame {
  const [durations, setDurations] = useState<DurationsByGame>({});
  // Asked again only when the set of games ahead changes.
  const plannedKey = games
    .filter(isPlannedGame)
    .map((g) => `${g.platform}_${g.appId}`)
    .sort()
    .join(",");

  useEffect(() => {
    if (!isSignedIn || !plannedKey) return;
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
  }, [isSignedIn, plannedKey]);

  return durations;
}
