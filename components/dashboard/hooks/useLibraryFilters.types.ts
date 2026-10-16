// components/dashboard/hooks/useLibraryFilters.types.ts

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

export interface UseLibraryFiltersProps {
  ownedGames: OwnedGame[];
  activePlatformTab: PlatformType | "all" | "duplicates" | "wishlist" | "collections";
  wishlistIds: number[];
  collections: LocalCollection[];
  selectedCollId: string | null;
}
