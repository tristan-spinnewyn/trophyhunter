import { useState, useMemo } from "react";
import type { OwnedGame, PlatformType } from "@/lib/types";
import type { LocalCollection } from "@/lib/storage";

export type StatusFilterType = "all" | "completed" | "in-progress" | "unstarted";
export type AchievementFilterType = "all" | "with-achievements" | "no-achievements";
export type SortOrderType =
  | "default"
  | "achievements-desc"
  | "achievements-asc"
  | "completion-desc"
  | "name-asc"
  | "playtime-desc";

interface UseLibraryFiltersProps {
  ownedGames: OwnedGame[];
  activePlatformTab: PlatformType | "all" | "duplicates" | "wishlist" | "collections";
  wishlistIds: number[];
  collections: LocalCollection[];
  selectedCollId: string | null;
}

export function useLibraryFilters({
  ownedGames,
  activePlatformTab,
  wishlistIds,
  collections,
  selectedCollId,
}: UseLibraryFiltersProps) {
  const [libPlatformFilter, setLibPlatformFilter] = useState<PlatformType | "all">("all");
  const [libStatusFilter, setLibStatusFilter] = useState<StatusFilterType>("all");
  const [libAchievementFilter, setLibAchievementFilter] = useState<AchievementFilterType>("all");
  const [libSortOrder, setLibSortOrder] = useState<SortOrderType>("default");
  const [libSearch, setLibSearch] = useState("");

  const filteredGames = useMemo(() => {
    const targetPlatform =
      activePlatformTab !== "all" ? activePlatformTab : libPlatformFilter;

    const list = ownedGames.filter((g) => {
      if (activePlatformTab === "wishlist") {
        if (!wishlistIds.includes(g.appId)) return false;
      } else if (activePlatformTab === "collections") {
        if (selectedCollId) {
          const coll = collections.find((c) => c.id === selectedCollId);
          if (!coll || !coll.gameIds.includes(g.appId)) return false;
        }
      } else if (targetPlatform !== "all" && activePlatformTab !== "duplicates") {
        if (g.platform !== targetPlatform) {
          return false;
        }
      }
      const isComplete =
        g.totalAchievements > 0 && g.unlockedCount >= g.totalAchievements;
      const isInProgress =
        g.unlockedCount > 0 &&
        (g.totalAchievements === 0 || g.unlockedCount < g.totalAchievements);

      const isUnstarted = g.unlockedCount === 0;

      if (libStatusFilter === "completed" && !isComplete) return false;
      if (libStatusFilter === "in-progress" && !isInProgress) return false;
      if (libStatusFilter === "unstarted" && !isUnstarted) return false;

      if (
        libAchievementFilter === "with-achievements" &&
        g.totalAchievements === 0
      ) {
        return false;
      }
      if (
        libAchievementFilter === "no-achievements" &&
        g.totalAchievements > 0
      ) {
        return false;
      }

      if (libSearch.trim()) {
        const q = libSearch.toLowerCase();
        if (!g.name.toLowerCase().includes(q) && !String(g.appId).includes(q)) {
          return false;
        }
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (libSortOrder === "achievements-desc") {
        if (b.totalAchievements !== a.totalAchievements) {
          return b.totalAchievements - a.totalAchievements;
        }
        return b.unlockedCount - a.unlockedCount;
      }
      if (libSortOrder === "achievements-asc") {
        if (a.totalAchievements !== b.totalAchievements) {
          return a.totalAchievements - b.totalAchievements;
        }
        return a.unlockedCount - b.unlockedCount;
      }
      if (libSortOrder === "completion-desc") {
        const pctA =
          a.totalAchievements > 0 ? a.unlockedCount / a.totalAchievements : 0;
        const pctB =
          b.totalAchievements > 0 ? b.unlockedCount / b.totalAchievements : 0;
        if (pctB !== pctA) return pctB - pctA;
        return a.name.localeCompare(b.name, "fr");
      }
      if (libSortOrder === "name-asc") {
        return a.name.localeCompare(b.name, "fr");
      }
      if (libSortOrder === "playtime-desc") {
        return (b.playtimeHours || 0) - (a.playtimeHours || 0);
      }
      const pctA =
        a.totalAchievements > 0 ? a.unlockedCount / a.totalAchievements : 0;
      const pctB =
        b.totalAchievements > 0 ? b.unlockedCount / b.totalAchievements : 0;
      if (pctB !== pctA) return pctB - pctA;
      return a.name.localeCompare(b.name, "fr");
    });
  }, [
    ownedGames,
    activePlatformTab,
    libPlatformFilter,
    libStatusFilter,
    libAchievementFilter,
    libSortOrder,
    libSearch,
    wishlistIds,
    collections,
    selectedCollId,
  ]);

  return {
    libPlatformFilter,
    setLibPlatformFilter,
    libStatusFilter,
    setLibStatusFilter,
    libAchievementFilter,
    setLibAchievementFilter,
    libSortOrder,
    setLibSortOrder,
    libSearch,
    setLibSearch,
    filteredGames,
  };
}
