// components/dashboard/hooks/libraryFilterUtils.ts

import type { OwnedGame, PlatformType } from "@/lib/types";
import type { LocalCollection } from "@/lib/storage";
import type {
  StatusFilterType,
  AchievementFilterType,
} from "./useLibraryFilters.types";

interface FilterParams {
  games: OwnedGame[];
  activePlatformTab: PlatformType | "all" | "duplicates" | "wishlist" | "collections";
  libPlatformFilter: PlatformType | "all";
  libStatusFilter: StatusFilterType;
  libAchievementFilter: AchievementFilterType;
  libSearch: string;
  wishlistIds: number[];
  collections: LocalCollection[];
  selectedCollId: string | null;
}

export function filterGames(params: FilterParams): OwnedGame[] {
  const {
    games, activePlatformTab, libPlatformFilter, libStatusFilter,
    libAchievementFilter, libSearch, wishlistIds, collections, selectedCollId,
  } = params;

  const targetPlatform = activePlatformTab !== "all" ? activePlatformTab : libPlatformFilter;

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

    const isComplete = g.totalAchievements > 0 && g.unlockedCount >= g.totalAchievements;
    const isInProgress = g.unlockedCount > 0 && (g.totalAchievements === 0 || g.unlockedCount < g.totalAchievements);
    const isUnstarted = g.unlockedCount === 0;

    if (libStatusFilter === "completed" && !isComplete) return false;
    if (libStatusFilter === "in-progress" && !isInProgress) return false;
    if (libStatusFilter === "unstarted" && !isUnstarted) return false;

    if (libAchievementFilter === "with-achievements" && g.totalAchievements === 0) return false;
    if (libAchievementFilter === "no-achievements" && g.totalAchievements > 0) return false;

    if (libSearch.trim()) {
      const q = libSearch.toLowerCase();
      if (!g.name.toLowerCase().includes(q) && !String(g.appId).includes(q)) return false;
    }
    return true;
  });
}
