// components/series/useGameSeries.ts
"use client";

import { useEffect, useState } from "react";
import type { GameRef } from "@/lib/types";
import type { SeriesMember, SeriesView } from "@/lib/series/series.types";

/**
 * The series of an owned game, loaded for a signed-in user, and a way to wish for its missing games.
 * `onWished` receives the Steam app id of a game just added to the wishlist.
 */
export function useGameSeries(game: GameRef | undefined, isSignedIn: boolean, onWished: (appId: number) => void) {
  const [series, setSeries] = useState<SeriesView | null>(null);
  const platform = game?.platform;
  const appId = game?.appId;

  useEffect(() => {
    if (!isSignedIn || !platform || appId === undefined) return;
    let isCurrent = true;
    fetch(`/api/user/game-series?platform=${platform}&appId=${appId}`)
      .then((res) => (res.ok ? res.json() : { series: null }))
      .then((data: { series?: SeriesView | null }) => {
        if (isCurrent) setSeries(data.series ?? null);
      })
      .catch(() => {
        if (isCurrent) setSeries(null);
      });
    return () => {
      isCurrent = false;
    };
  }, [isSignedIn, platform, appId]);

  const wishFor = async (member: SeriesMember) => {
    if (member.steamAppId === undefined) return;
    const res = await fetch("/api/user/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appId: member.steamAppId, platform: "steam", isWishlist: true, name: member.name }),
    }).catch(() => null);
    if (res?.ok) onWished(member.steamAppId);
  };

  return { series: isSignedIn && game ? series : null, wishFor };
}
