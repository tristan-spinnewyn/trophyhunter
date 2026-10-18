// lib/epic/sync-progress.ts
import type { User } from "../types";
import { getUserOwnedGames, saveUserGameProgress, saveUserOwnedGames } from "../db";

export function buildUnlockedSlugs(
  unlockedTitles: readonly string[],
  totalUnlocked: number,
  existingIds: readonly string[]
): string[] {
  if (unlockedTitles.length > 0) {
    return unlockedTitles.map((t, idx) => `ach_${idx + 1}_${t.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 30)}`);
  }
  if (existingIds.length > 0) return [...existingIds];
  const slugs: string[] = [];
  for (let i = 1; i <= totalUnlocked; i++) slugs.push(`ach_${i}`);
  return slugs;
}

export function persistEpicGameSync(
  authUser: User | null,
  numAppId: number,
  unlockedIds: string[],
  totalAchievements: number,
  totalUnlocked: number
): void {
  if (!authUser) return;
  if (unlockedIds.length > 0) {
    saveUserGameProgress(authUser.id, numAppId, "epic", {
      unlockedIds,
      lastPlayed: new Date().toISOString(),
      notes: {},
    });
  }
  if (unlockedIds.length === 0 && totalAchievements === 0 && totalUnlocked === 0) return;

  const owned = getUserOwnedGames(authUser.id).find((g) => g.appId === numAppId && g.platform === "epic");
  if (owned) {
    saveUserOwnedGames(authUser.id, [
      {
        ...owned,
        totalAchievements: totalAchievements || owned.totalAchievements,
        unlockedCount: Math.max(totalUnlocked, unlockedIds.length, owned.unlockedCount || 0),
      },
    ]);
  }
}

