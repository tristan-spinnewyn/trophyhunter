// lib/epic/sync-progress.ts
import { getUserOwnedGames, saveUserGameProgress, saveUserOwnedGames } from "../db";

export function buildUnlockedSlugs(unlockedTitles: string[], totalUnlocked: number, existingIds: string[]): string[] {
  if (unlockedTitles.length > 0) {
    return unlockedTitles.map((t, idx) => `ach_${idx + 1}_${t.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 30)}`);
  }
  if (existingIds.length > 0) return existingIds;
  const slugs: string[] = [];
  for (let i = 1; i <= totalUnlocked; i++) slugs.push(`ach_${i}`);
  return slugs;
}

export function persistEpicGameSync(
  authUser: any,
  numAppId: number,
  unlockedIds: string[],
  totalAchievements: number,
  totalUnlocked: number
): void {
  if (!authUser || unlockedIds.length === 0) return;
  saveUserGameProgress(authUser.id, numAppId, "epic", {
    unlockedIds,
    lastPlayed: new Date().toISOString(),
    notes: {},
  });
  const owned = getUserOwnedGames(authUser.id).find((g) => g.appId === numAppId && g.platform === "epic");
  if (owned) {
    saveUserOwnedGames(authUser.id, [
      {
        ...owned,
        totalAchievements: totalAchievements || owned.totalAchievements,
        unlockedCount: totalUnlocked || unlockedIds.length,
      },
    ]);
  }
}
