import { useMemo } from "react";
import type { OwnedGame, UserAccountProfile } from "@/lib/types";
import { ALL_PLATFORMS, normalizeGameTitle } from "@/lib/storage";

export interface GlobalDashboardStats {
  connectedCount: number;
  totalGamesOwned: number;
  totalAchievementsUnlocked: number;
  totalCompletedGames: number;
  totalHours: number;
  avgCompletion: number;
  trackedGamesCount: number;
}

export interface EpicGameCounts {
  total: number;
  withAch: number;
  noAch: number;
}

export function useDashboardStats(
  accountProfile: UserAccountProfile,
  ownedGames: OwnedGame[]
) {
  // Derived: Duplicate Groups
  const duplicateGroups = useMemo(() => {
    const groups = new Map<string, OwnedGame[]>();
    for (const g of ownedGames) {
      const norm = normalizeGameTitle(g.name);
      if (!norm) continue;
      const arr = groups.get(norm) || [];
      arr.push(g);
      groups.set(norm, arr);
    }
    const result: Array<{ title: string; games: OwnedGame[] }> = [];
    for (const [_, games] of groups.entries()) {
      const platforms = new Set(games.map((g) => g.platform));
      if (platforms.size > 1) {
        result.push({
          title: games[0].name,
          games,
        });
      }
    }
    return result;
  }, [ownedGames]);

  // Derived: Global Statistics
  const globalStats = useMemo<GlobalDashboardStats>(() => {
    const connectedAccounts = ALL_PLATFORMS.filter(
      (p) => !!accountProfile.accounts[p]
    );

    let totalGamesOwned = 0;
    let totalAchievementsUnlocked = 0;
    let totalCompletedGames = 0;
    let totalHours = 0;

    const localByPlatform: Record<
      string,
      { games: number; achievements: number; completed: number; hours: number }
    > = {};

    for (const p of ALL_PLATFORMS) {
      localByPlatform[p] = { games: 0, achievements: 0, completed: 0, hours: 0 };
    }

    for (const g of ownedGames) {
      const p = g.platform;
      if (!localByPlatform[p]) {
        localByPlatform[p] = { games: 0, achievements: 0, completed: 0, hours: 0 };
      }
      localByPlatform[p].games += 1;
      localByPlatform[p].achievements += g.unlockedCount || 0;
      if (g.totalAchievements > 0 && g.unlockedCount >= g.totalAchievements) {
        localByPlatform[p].completed += 1;
      }
      localByPlatform[p].hours += g.playtimeHours || 0;
    }

    const seenPlatforms = new Set<string>();

    for (const plat of ALL_PLATFORMS) {
      const acc = accountProfile.accounts[plat];
      if (!acc) continue;
      seenPlatforms.add(plat);

      const local = localByPlatform[plat] || {
        games: 0,
        achievements: 0,
        completed: 0,
        hours: 0,
      };

      totalGamesOwned += Math.max(acc.stats.gamesOwned || 0, local.games);
      totalAchievementsUnlocked += Math.max(
        acc.stats.totalAchievements || 0,
        local.achievements
      );
      totalCompletedGames += Math.max(
        acc.stats.completedGames || 0,
        local.completed
      );
      totalHours += Math.max(acc.stats.hoursPlayed || 0, local.hours);
    }

    for (const [plat, local] of Object.entries(localByPlatform)) {
      if (!seenPlatforms.has(plat)) {
        totalGamesOwned += local.games;
        totalAchievementsUnlocked += local.achievements;
        totalCompletedGames += local.completed;
        totalHours += local.hours;
      }
    }

    const gamesWithAch = ownedGames.filter((g) => g.totalAchievements > 0);
    const avgCompletion =
      gamesWithAch.length > 0
        ? Math.round(
            (gamesWithAch.reduce(
              (acc, g) =>
                acc + Math.min(1, (g.unlockedCount || 0) / g.totalAchievements),
              0
            ) /
              gamesWithAch.length) *
              100
          )
        : 0;

    return {
      connectedCount: connectedAccounts.length,
      totalGamesOwned,
      totalAchievementsUnlocked,
      totalCompletedGames,
      totalHours: Math.round(totalHours * 10) / 10,
      avgCompletion,
      trackedGamesCount: ownedGames.length,
    };
  }, [accountProfile, ownedGames]);

  // Derived: Per-platform game counts
  const platformCounts = useMemo(() => {
    const counts: Record<string, number> = { all: ownedGames.length };
    for (const p of ALL_PLATFORMS) {
      counts[p] = 0;
    }
    for (const g of ownedGames) {
      counts[g.platform] = (counts[g.platform] || 0) + 1;
    }
    return counts;
  }, [ownedGames]);

  // Derived: Epic-specific counts
  const epicCounts = useMemo<EpicGameCounts>(() => {
    const epicGames = ownedGames.filter((g) => g.platform === "epic");
    const withAch = epicGames.filter((g) => g.totalAchievements > 0).length;
    return {
      total: epicGames.length,
      withAch,
      noAch: epicGames.length - withAch,
    };
  }, [ownedGames]);

  return {
    duplicateGroups,
    globalStats,
    platformCounts,
    epicCounts,
  };
}
