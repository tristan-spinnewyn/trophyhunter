// lib/library/library-sort.ts

import type { OwnedGame } from "@/lib/types";

export type SortOrderType =
  | "default"
  | "achievements-desc"
  | "achievements-asc"
  | "completion-desc"
  | "name-asc"
  | "playtime-desc";

export function sortGames(list: OwnedGame[], order: SortOrderType): OwnedGame[] {
  return [...list].sort((a, b) => {
    if (order === "achievements-desc") {
      if (b.totalAchievements !== a.totalAchievements) {
        return b.totalAchievements - a.totalAchievements;
      }
      return b.unlockedCount - a.unlockedCount;
    }
    if (order === "achievements-asc") {
      if (a.totalAchievements !== b.totalAchievements) {
        return a.totalAchievements - b.totalAchievements;
      }
      return a.unlockedCount - b.unlockedCount;
    }
    if (order === "name-asc") {
      return a.name.localeCompare(b.name, "fr");
    }
    if (order === "playtime-desc") {
      return (b.playtimeHours || 0) - (a.playtimeHours || 0);
    }
    const pctA = a.totalAchievements > 0 ? a.unlockedCount / a.totalAchievements : 0;
    const pctB = b.totalAchievements > 0 ? b.unlockedCount / b.totalAchievements : 0;
    if (pctB !== pctA) return pctB - pctA;
    return a.name.localeCompare(b.name, "fr");
  });
}
