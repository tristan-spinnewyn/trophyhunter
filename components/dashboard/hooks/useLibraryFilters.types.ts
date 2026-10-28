// components/dashboard/hooks/useLibraryFilters.types.ts

import type { OwnedGame, PlatformType, CollectionWithGames } from "@/lib/types";
import type { DashboardTabType } from "@/components/dashboard/DashboardNavTabs";

export type StatusFilterType =
  | "all"
  | "backlog"
  | "in-progress"
  | "completed"
  | "platinum"
  | "unstarted";
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
  activePlatformTab: DashboardTabType;
  wishlistIds: number[];
  collections: CollectionWithGames[];
  selectedCollId: string | null;
}
