// components/dashboard/hooks/epicEnrichmentResolver.ts

import type { OwnedGame } from "@/lib/types";
import { isUnsplashPlaceholder } from "@/lib/epic-codenames";

export async function resolveSingleEpicGame(game: OwnedGame): Promise<OwnedGame> {
  try {
    const r = await fetch(
      `/api/game/${game.appId}?name=${encodeURIComponent(game.name)}&platform=epic&fast=1`
    );
    if (!r.ok) return game;
    const details = await r.json();
    const resolvedTotal = details?.totalAchievements || 0;
    const resolvedHeader = !isUnsplashPlaceholder(game.headerImg)
      ? game.headerImg
      : details?.headerImg || game.headerImg;

    if (resolvedTotal > 0 || resolvedHeader !== game.headerImg) {
      return {
        ...game,
        totalAchievements: resolvedTotal,
        headerImg: resolvedHeader,
      };
    }
    return game;
  } catch {
    return game;
  }
}
