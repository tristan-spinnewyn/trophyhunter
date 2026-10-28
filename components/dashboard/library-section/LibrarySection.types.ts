// components/dashboard/library-section/LibrarySection.types.ts

import type {
  GameStatus,
  OwnedGame,
  PlatformType,
  UserAccountProfile,
} from "@/lib/types";
import type { CollectionWithGames } from "@/lib/types";
import type { DashboardTabType } from "@/components/dashboard/DashboardNavTabs";
import type {
  StatusFilterType,
  AchievementFilterType,
  SortOrderType,
} from "@/components/dashboard/hooks/useLibraryFilters";

export interface LibrarySectionProps {
  readonly activePlatformTab: DashboardTabType;
  readonly filteredGames: OwnedGame[];
  readonly totalOwnedGamesCount: number;
  readonly platformGameCount: number;
  readonly steamAccount?: UserAccountProfile["accounts"]["steam"];
  readonly onOpenAddGame: () => void;
  readonly onAddApiKeyClick: () => void;
  readonly libSearch: string;
  readonly setLibSearch: (val: string) => void;
  readonly libPlatformFilter: PlatformType | "all";
  readonly setLibPlatformFilter: (val: PlatformType | "all") => void;
  readonly libStatusFilter: StatusFilterType;
  readonly setLibStatusFilter: (val: StatusFilterType) => void;
  readonly libAchievementFilter: AchievementFilterType;
  readonly setLibAchievementFilter: (val: AchievementFilterType) => void;
  readonly libSortOrder: SortOrderType;
  readonly setLibSortOrder: (val: SortOrderType) => void;
  readonly selectedCollId: string | null;
  readonly wishlistIds: number[];
  readonly collections: CollectionWithGames[];
  readonly onSelectGame: (appId: number) => void;
  readonly onToggleWishlist: (appId: number, platform: PlatformType) => void;
  readonly onOpenAddToCollection: (game: OwnedGame) => void;
  readonly onRemoveFromCollection: (
    collId: string,
    appId: number,
    platform: PlatformType
  ) => void;
  readonly onSyncGame: (game: OwnedGame) => Promise<void>;
  readonly onRemoveGame: (appId: number, platform: PlatformType) => Promise<void>;
  readonly onUpdateGameStatus?: (
    appId: number,
    platform: PlatformType,
    status: GameStatus
  ) => Promise<void> | void;
  readonly onConnectAndSyncSteam: () => Promise<void>;
  readonly isSyncingSteam: boolean;
}
