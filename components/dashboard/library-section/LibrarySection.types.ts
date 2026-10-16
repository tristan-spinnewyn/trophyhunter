// components/dashboard/library-section/LibrarySection.types.ts

import type { OwnedGame, PlatformType, UserAccountProfile } from "@/lib/types";
import type { LocalCollection } from "@/lib/storage";
import type { DashboardTabType } from "@/components/dashboard/DashboardNavTabs";
import type {
  StatusFilterType,
  AchievementFilterType,
  SortOrderType,
} from "@/components/dashboard/hooks/useLibraryFilters";

export interface LibrarySectionProps {
  activePlatformTab: DashboardTabType;
  filteredGames: OwnedGame[];
  totalOwnedGamesCount: number;
  platformGameCount: number;
  steamAccount?: UserAccountProfile["accounts"]["steam"];
  onOpenAddGame: () => void;
  onAddApiKeyClick: () => void;
  // Filters
  libSearch: string;
  setLibSearch: (val: string) => void;
  libPlatformFilter: PlatformType | "all";
  setLibPlatformFilter: (val: PlatformType | "all") => void;
  libStatusFilter: StatusFilterType;
  setLibStatusFilter: (val: StatusFilterType) => void;
  libAchievementFilter: AchievementFilterType;
  setLibAchievementFilter: (val: AchievementFilterType) => void;
  libSortOrder: SortOrderType;
  setLibSortOrder: (val: SortOrderType) => void;
  // Card Actions & State
  selectedCollId: string | null;
  wishlistIds: number[];
  collections: LocalCollection[];
  onSelectGame: (appId: number) => void;
  onToggleWishlist: (appId: number, platform: PlatformType) => void;
  onOpenAddToCollection: (game: OwnedGame) => void;
  onRemoveFromCollection: (
    collId: string,
    appId: number,
    platform: PlatformType
  ) => void;
  onSyncGame: (game: OwnedGame) => Promise<void>;
  onRemoveGame: (appId: number, platform: PlatformType) => Promise<void>;
  onConnectAndSyncSteam: () => Promise<void>;
  isSyncingSteam: boolean;
}
