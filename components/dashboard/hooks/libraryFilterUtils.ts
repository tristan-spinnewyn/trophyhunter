// components/dashboard/hooks/libraryFilterUtils.ts

import type { OwnedGame, PlatformType } from "@/lib/types";
import type { LocalCollection } from "@/lib/storage";
import type { DashboardTabType } from "@/components/dashboard/DashboardNavTabs";
import { resolveGameStatus } from "@/lib/game-status/game-status.services";
import type {
  StatusFilterType,
  AchievementFilterType,
} from "./useLibraryFilters.types";

interface FilterParams {
  readonly games: OwnedGame[];
  readonly activePlatformTab: DashboardTabType;
  readonly libPlatformFilter: PlatformType | "all";
  readonly libStatusFilter: StatusFilterType;
  readonly libAchievementFilter: AchievementFilterType;
  readonly libSearch: string;
  readonly wishlistIds: number[];
  readonly collections: LocalCollection[];
  readonly selectedCollId: string | null;
}

export function filterGames(params: FilterParams): OwnedGame[] {
  const {
    games, activePlatformTab, libPlatformFilter, libStatusFilter,
    libAchievementFilter, libSearch, wishlistIds, collections, selectedCollId,
  } = params;

  const isFeatureTab =
    activePlatformTab === "all" ||
    activePlatformTab === "duplicates" ||
    activePlatformTab === "wishlist" ||
    activePlatformTab === "collections" ||
    activePlatformTab === "gamepass";

  const targetPlatform = !isFeatureTab ? activePlatformTab : libPlatformFilter;

  return games.filter((g) => {
    if (activePlatformTab === "wishlist") {
      if (!wishlistIds.includes(g.appId)) return false;
    } else if (activePlatformTab === "collections") {
      if (selectedCollId) {
        const coll = collections.find((c) => c.id === selectedCollId);
        if (!coll || !coll.gameIds.includes(g.appId)) return false;
      }
    } else if (targetPlatform !== "all" && activePlatformTab !== "duplicates") {
      if (g.platform !== targetPlatform) return false;
    }

    const gameStatus = resolveGameStatus(g.status);
    const isPlatinum = g.totalAchievements > 0 && g.unlockedCount >= g.totalAchievements;

    if (libStatusFilter === "backlog" && gameStatus !== "backlog") return false;
    if (libStatusFilter === "in-progress" && gameStatus !== "in-progress") return false;
    if (libStatusFilter === "completed" && gameStatus !== "completed") return false;
    if (libStatusFilter === "platinum" && !isPlatinum) return false;
    if (libStatusFilter === "unstarted" && (gameStatus !== "backlog" || g.unlockedCount > 0)) return false;

    if (libAchievementFilter === "with-achievements" && g.totalAchievements === 0) return false;
    if (libAchievementFilter === "no-achievements" && g.totalAchievements > 0) return false;

    if (libSearch.trim()) {
      const q = libSearch.toLowerCase();
      if (!g.name.toLowerCase().includes(q) && !String(g.appId).includes(q)) return false;
    }
    return true;
  });
}
