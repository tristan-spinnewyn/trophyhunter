// app/game/[id]/hooks/useAchievementFilters.ts
"use client";

import { useState, useMemo } from "react";
import type {
  Achievement,
  FilterStatus,
  SortOrder,
  UserGameProgress,
} from "@/lib/types";
import { isAchievementPinned } from "@/lib/hunting/pinned-targets.services";

export function useAchievementFilters(
  achievements: Achievement[] | undefined,
  progress: UserGameProgress
) {
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [search, setSearch] = useState<string>("");
  const [sort, setSort] = useState<SortOrder>("default");
  const [revealSecrets, setRevealSecrets] = useState<boolean>(false);

  const displayedAchievements = useMemo(() => {
    if (!achievements) return [];
    return achievements
      .filter((ach) => {
        const isUnlocked = progress.unlockedIds.includes(ach.id);
        if (filter === "unlocked" && !isUnlocked) return false;
        if (filter === "locked" && isUnlocked) return false;
        if (filter === "missable" && !ach.missable) return false;
        if (filter === "hidden" && !ach.hidden) return false;
        if (filter === "pinned" && !isAchievementPinned(progress.pinnedIds, ach.id)) {
          return false;
        }

        if (search.trim()) {
          const q = search.toLowerCase();
          const nameMatch = ach.name.toLowerCase().includes(q);
          const descMatch = (ach.desc || "").toLowerCase().includes(q);
          const noteMatch = (progress.notes[ach.id] || "")
            .toLowerCase()
            .includes(q);
          if (!nameMatch && !descMatch && !noteMatch) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sort === "rarity-asc") return a.percent - b.percent;
        if (sort === "rarity-desc") return b.percent - a.percent;
        if (sort === "name-asc") return a.name.localeCompare(b.name, "fr");
        return 0;
      });
  }, [achievements, progress, filter, search, sort]);

  const counts = useMemo(() => {
    if (!achievements) {
      return { all: 0, locked: 0, unlocked: 0, missable: 0, hidden: 0, pinned: 0 };
    }
    const all = achievements.length;
    const unlocked = progress.unlockedIds.length;
    const missable = achievements.filter((a) => a.missable).length;
    const hidden = achievements.filter((a) => a.hidden).length;
    const pinned = achievements.filter((a) =>
      isAchievementPinned(progress.pinnedIds, a.id)
    ).length;
    return {
      all,
      unlocked,
      locked: Math.max(0, all - unlocked),
      missable,
      hidden,
      pinned,
    };
  }, [achievements, progress]);

  return {
    filter,
    setFilter,
    search,
    setSearch,
    sort,
    setSort,
    revealSecrets,
    setRevealSecrets,
    displayedAchievements,
    counts,
  };
}
