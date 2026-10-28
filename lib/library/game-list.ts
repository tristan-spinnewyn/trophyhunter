// components/dashboard/utils.ts
import type { OwnedGame, PlatformType } from "@/lib/types";
import { isUnsplashPlaceholder } from "@/lib/epic/game-metadata";
import { isValidGameStatus, resolveGameStatus } from "@/lib/game-status/game-status.services";

export function mergeGamesList(
  base: OwnedGame[],
  incoming: OwnedGame[]
): OwnedGame[] {
  const map = new Map<string, OwnedGame>();
  for (const g of base) {
    map.set(`${g.platform}_${g.appId}`, {
      ...g,
      status: resolveGameStatus(g.status),
    });
  }
  for (const g of incoming) {
    const key = `${g.platform}_${g.appId}`;
    const existing = map.get(key);
    if (existing) {
      map.set(key, {
        ...existing,
        ...g,
        totalAchievements:
          g.totalAchievements > 0
            ? g.totalAchievements
            : existing.totalAchievements,
        unlockedCount: Math.max(
          g.unlockedCount || 0,
          existing.unlockedCount || 0
        ),
        playtimeHours: g.playtimeHours ?? existing.playtimeHours,
        addedAt: existing.addedAt || g.addedAt,
        status: isValidGameStatus(g.status)
          ? g.status
          : resolveGameStatus(existing.status),
      });
    } else {
      map.set(key, {
        ...g,
        status: resolveGameStatus(g.status),
      });
    }
  }
  return Array.from(map.values());
}

export function replacePlatformInList(
  base: OwnedGame[],
  platform: PlatformType,
  incoming: OwnedGame[]
): OwnedGame[] {
  const existingByPlatform = new Map<number, OwnedGame>();
  for (const g of base) {
    if (g.platform === platform) {
      existingByPlatform.set(g.appId, g);
    }
  }
  const kept = base.filter((g) => g.platform !== platform);
  const enrichedIncoming = incoming.map((g) => {
    const prev = existingByPlatform.get(g.appId);
    if (!prev) return { ...g, status: resolveGameStatus(g.status) };
    return {
      ...g,
      totalAchievements:
        g.totalAchievements > 0 ? g.totalAchievements : prev.totalAchievements,
      unlockedCount: Math.max(g.unlockedCount || 0, prev.unlockedCount || 0),
      headerImg: !isUnsplashPlaceholder(g.headerImg)
        ? g.headerImg
        : prev.headerImg || g.headerImg,
      status: isValidGameStatus(g.status)
        ? g.status
        : resolveGameStatus(prev.status),
    };
  });
  return mergeGamesList(kept, enrichedIncoming);
}
