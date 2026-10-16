import type { OwnedGame } from "@/lib/types";

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
