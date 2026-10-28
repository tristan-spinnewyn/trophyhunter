// components/library/section/LibrarySection.tsx
import LibraryGameCard from "@/components/library/LibraryGameCard";
import { LibrarySectionHeader } from "./LibrarySectionHeader";
import { LibrarySectionFilters } from "./LibrarySectionFilters";
import { LibrarySectionEmptyState } from "./LibrarySectionEmptyState";
import { LibraryStatusSections } from "./LibraryStatusSections";
import type {
  GameStatus,
  OwnedGame,
  PlatformType,
  UserAccountProfile,
} from "@/lib/types";
import type { CollectionWithGames } from "@/lib/types";
import type { LibraryTab, AchievementFilterType } from "@/lib/library/library-filters";
import type { SortOrderType } from "@/lib/library/library-sort";

export interface LibrarySectionProps {
  readonly activePlatformTab: LibraryTab;
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
}


export default function LibrarySection({
  activePlatformTab,
  filteredGames,
  totalOwnedGamesCount,
  platformGameCount,
  steamAccount,
  onOpenAddGame,
  onAddApiKeyClick,
  libSearch,
  setLibSearch,
  libPlatformFilter,
  setLibPlatformFilter,
  libAchievementFilter,
  setLibAchievementFilter,
  libSortOrder,
  setLibSortOrder,
  selectedCollId,
  wishlistIds,
  collections,
  onSelectGame,
  onToggleWishlist,
  onOpenAddToCollection,
  onRemoveFromCollection,
  onSyncGame,
  onRemoveGame,
  onUpdateGameStatus,
}: LibrarySectionProps) {
  return (
    <section className="space-y-4">
      <LibrarySectionHeader
        activePlatformTab={activePlatformTab}
        filteredCount={filteredGames.length}
        totalOwnedGamesCount={totalOwnedGamesCount}
        platformGameCount={platformGameCount}
        steamAccount={steamAccount}
        onOpenAddGame={onOpenAddGame}
        onAddApiKeyClick={onAddApiKeyClick}
      />

      <LibrarySectionFilters
        activePlatformTab={activePlatformTab}
        libSearch={libSearch}
        setLibSearch={setLibSearch}
        libPlatformFilter={libPlatformFilter}
        setLibPlatformFilter={setLibPlatformFilter}
        libAchievementFilter={libAchievementFilter}
        setLibAchievementFilter={setLibAchievementFilter}
        libSortOrder={libSortOrder}
        setLibSortOrder={setLibSortOrder}
      />

      {filteredGames.length > 0 ? (
        <LibraryStatusSections
          games={filteredGames}
          renderGame={(g) => (
            <LibraryGameCard
              key={`${g.platform}_${g.appId}`}
              game={g}
              steamAccount={steamAccount}
              activePlatformTab={activePlatformTab}
              selectedCollId={selectedCollId}
              wishlistIds={wishlistIds}
              collections={collections}
              onSelectGame={onSelectGame}
              onToggleWishlist={onToggleWishlist}
              onOpenAddToCollection={onOpenAddToCollection}
              onRemoveFromCollection={onRemoveFromCollection}
              onSyncGame={onSyncGame}
              onRemoveGame={onRemoveGame}
              onUpdateGameStatus={onUpdateGameStatus}
            />
          )}
        />
      ) : (
        <LibrarySectionEmptyState
          totalOwnedGamesCount={totalOwnedGamesCount}
          onOpenAddGame={onOpenAddGame}
        />
      )}
    </section>
  );
}
