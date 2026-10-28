// components/dashboard/hooks/useLibraryFilters.ts
"use client";

import { useState, useMemo } from "react";
import type { PlatformType } from "@/lib/types";
import type { UseLibraryFiltersProps } from "./useLibraryFilters.types";
import { filterGames } from "@/lib/library/library-filters";
import { sortGames } from "@/lib/library/library-sort";
import type { StatusFilterType, AchievementFilterType } from "@/lib/library/library-filters";
import type { SortOrderType } from "@/lib/library/library-sort";


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
    const matched = filterGames({
      games: ownedGames,
      activePlatformTab,
      libPlatformFilter,
      libStatusFilter,
      libAchievementFilter,
      libSearch,
      wishlistIds,
      collections,
      selectedCollId,
    });
    return sortGames(matched, libSortOrder);
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
