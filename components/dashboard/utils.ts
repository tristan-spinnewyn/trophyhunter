import type { OwnedGame, PlatformType } from "@/lib/types";
import { isUnsplashPlaceholder } from "@/lib/epic-codenames";

/**
 * Merges an incoming list of OwnedGames into a base list,
 * preserving existing metadata and taking the highest achievement progress.
 */
export function mergeGamesList(
  base: OwnedGame[],
  incoming: OwnedGame[]
): OwnedGame[] {
  const map = new Map<string, OwnedGame>();
  for (const g of base) {
    map.set(`${g.platform}_${g.appId}`, g);
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
      });
    } else {
      map.set(key, g);
    }
  }
  return Array.from(map.values());
}

/**
 * Replaces all games of a given platform with incoming games,
 * preserving enriched images and progress from previous records.
 */
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
    if (!prev) return g;
    return {
      ...g,
      totalAchievements:
        g.totalAchievements > 0 ? g.totalAchievements : prev.totalAchievements,
      unlockedCount: Math.max(g.unlockedCount || 0, prev.unlockedCount || 0),
      headerImg: !isUnsplashPlaceholder(g.headerImg)
        ? g.headerImg
        : prev.headerImg || g.headerImg,
    };
  });
  return mergeGamesList(kept, enrichedIncoming);
}
