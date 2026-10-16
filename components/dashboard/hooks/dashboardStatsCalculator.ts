// components/dashboard/hooks/dashboardStatsCalculator.ts

import type { OwnedGame, UserAccountProfile } from "@/lib/types";
import { ALL_PLATFORMS, normalizeGameTitle } from "@/lib/storage";
import type {
  GlobalDashboardStats,
  EpicGameCounts,
  DuplicateGroup,
} from "./useDashboardStats.types";

export function calculateDuplicateGroups(ownedGames: OwnedGame[]): DuplicateGroup[] {
  const groups = new Map<string, OwnedGame[]>();
  for (const g of ownedGames) {
    const norm = normalizeGameTitle(g.name);
    if (!norm) continue;
    const arr = groups.get(norm) || [];
    arr.push(g);
    groups.set(norm, arr);
  }
  const result: DuplicateGroup[] = [];
  for (const games of groups.values()) {
    const platforms = new Set(games.map((g) => g.platform));
    if (platforms.size > 1) {
      result.push({ title: games[0].name, games });
    }
  }
  return result;
}

export function calculatePlatformCounts(ownedGames: OwnedGame[]): Record<string, number> {
  const counts: Record<string, number> = { all: ownedGames.length };
  for (const p of ALL_PLATFORMS) counts[p] = 0;
  for (const g of ownedGames) {
    counts[g.platform] = (counts[g.platform] || 0) + 1;
  }
  return counts;
}

export function calculateEpicCounts(ownedGames: OwnedGame[]): EpicGameCounts {
  const epicGames = ownedGames.filter((g) => g.platform === "epic");
  const withAch = epicGames.filter((g) => g.totalAchievements > 0).length;
  return { total: epicGames.length, withAch, noAch: epicGames.length - withAch };
}

export function calculateGlobalStats(
  accountProfile: UserAccountProfile,
  ownedGames: OwnedGame[]
): GlobalDashboardStats {
  const connectedAccounts = ALL_PLATFORMS.filter((p) => !!accountProfile.accounts[p]);
  const localByPlatform: Record<string, { games: number; ach: number; comp: number; hrs: number }> = {};
  for (const p of ALL_PLATFORMS) localByPlatform[p] = { games: 0, ach: 0, comp: 0, hrs: 0 };

  for (const g of ownedGames) {
    const row = localByPlatform[g.platform] || { games: 0, ach: 0, comp: 0, hrs: 0 };
    localByPlatform[g.platform] = row;
    row.games += 1;
    row.ach += g.unlockedCount || 0;
    if (g.totalAchievements > 0 && g.unlockedCount >= g.totalAchievements) row.comp += 1;
    row.hrs += g.playtimeHours || 0;
  }

  let totalGames = 0, totalAch = 0, totalComp = 0, totalHrs = 0;
  const seenPlatforms = new Set<string>();

  for (const plat of ALL_PLATFORMS) {
    const acc = accountProfile.accounts[plat];
    if (!acc) continue;
    seenPlatforms.add(plat);
    const loc = localByPlatform[plat];
    totalGames += Math.max(acc.stats.gamesOwned || 0, loc.games);
    totalAch += Math.max(acc.stats.totalAchievements || 0, loc.ach);
    totalComp += Math.max(acc.stats.completedGames || 0, loc.comp);
    totalHrs += Math.max(acc.stats.hoursPlayed || 0, loc.hrs);
  }

  for (const [plat, loc] of Object.entries(localByPlatform)) {
    if (!seenPlatforms.has(plat)) {
      totalGames += loc.games;
      totalAch += loc.ach;
      totalComp += loc.comp;
      totalHrs += loc.hrs;
    }
  }

  const withAch = ownedGames.filter((g) => g.totalAchievements > 0);
  const avgCompletion = withAch.length > 0
    ? Math.round((withAch.reduce((acc, g) => acc + Math.min(1, (g.unlockedCount || 0) / g.totalAchievements), 0) / withAch.length) * 100)
    : 0;

  return {
    connectedCount: connectedAccounts.length,
    totalGamesOwned: totalGames,
    totalAchievementsUnlocked: totalAch,
    totalCompletedGames: totalComp,
    totalHours: Math.round(totalHrs * 10) / 10,
    avgCompletion,
    trackedGamesCount: ownedGames.length,
  };
}
