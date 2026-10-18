// components/dashboard/hooks/epicEnrichmentResolver.ts
import type { OwnedGame } from "@/lib/types";
import { isUnsplashPlaceholder } from "@/lib/epic-codenames";

export async function resolveSingleEpicGame(game: OwnedGame): Promise<OwnedGame> {
  try {
    let unlockedCount = game.unlockedCount || 0;
    let totalAchievements = game.totalAchievements || 0;
    let headerImg = game.headerImg;

    try {
      const syncRes = await fetch(
        `/api/sync?platform=epic&appId=${game.appId}&name=${encodeURIComponent(game.name)}`
      );
      if (syncRes.ok) {
        const syncData = await syncRes.json();
        if (syncData?.success && !syncData.requiresToken) {
          unlockedCount = Math.max(unlockedCount, Number(syncData.count) || 0);
          totalAchievements = Math.max(totalAchievements, Number(syncData.totalAchievements) || 0);
        }
      }
    } catch {}

    if (totalAchievements === 0 || isUnsplashPlaceholder(headerImg)) {
      const r = await fetch(
        `/api/game/${game.appId}?name=${encodeURIComponent(game.name)}&platform=epic&fast=1`
      );
      if (r.ok) {
        const details = await r.json();
        totalAchievements = Math.max(totalAchievements, Number(details?.totalAchievements) || 0);
        if (isUnsplashPlaceholder(headerImg) && details?.headerImg) {
          headerImg = details.headerImg;
        }
      }
    }

    if (
      unlockedCount !== (game.unlockedCount || 0) ||
      totalAchievements !== (game.totalAchievements || 0) ||
      headerImg !== game.headerImg
    ) {
      return {
        ...game,
        unlockedCount,
        totalAchievements,
        headerImg,
      };
    }
    return game;
  } catch {
    return game;
  }
}

