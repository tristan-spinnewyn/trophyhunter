// components/library/section/LibrarySection.tsx
import LibraryGameCard from "@/components/library/LibraryGameCard";
import { LibrarySectionHeader } from "./LibrarySectionHeader";
import { LibrarySectionFilters } from "./LibrarySectionFilters";
import { LibrarySectionEmptyState } from "./LibrarySectionEmptyState";
import { LibraryStatusSections } from "./LibraryStatusSections";
import { LibrarySkeleton } from "./LibrarySkeleton";
import { StartedBacklogNotice } from "./StartedBacklogNotice";
import { AcquiredWishlistNotice } from "./AcquiredWishlistNotice";
import type {
  GameStatus,
  OwnedGame,
  PlatformType,
  UserAccountProfile,
} from "@/lib/types";
import type { CollectionWithGames, GameDurations, PlaySession } from "@/lib/types";
import type { LibraryTab, AchievementFilterType } from "@/lib/library/library-filters";
import type { SortOrderType } from "@/lib/library/library-sort";
import { DEFAULT_USER_SETTINGS } from "@/lib/settings/user-settings-input";
import { StaleInProgressNotice } from "./StaleInProgressNotice";

export interface LibrarySectionProps {
  readonly isLoading?: boolean;
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
  readonly onPlayNext?: (appId: number, platform: PlatformType) => Promise<void> | void;
  readonly onRemoveFromQueue?: (appId: number, platform: PlatformType) => Promise<void> | void;
  readonly onReorderQueue?: (visibleShelf: OwnedGame[], visibleQueue: OwnedGame[]) => Promise<void> | void;
  /** How long the backlog games take to beat, keyed `platform_appId`. */
  readonly backlogDurations?: Readonly<Record<string, GameDurations>>;
  /** Weeks without a session before an in-progress game is suggested a pause. */
  readonly staleAfterWeeks?: number;
  /** Recent play sessions, for the backlog's pace estimate. */
  readonly recentSessions?: readonly PlaySession[];
}


export default function LibrarySection({
  isLoading = false,
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
  onPlayNext,
  onRemoveFromQueue,
  onReorderQueue,
  backlogDurations,
  staleAfterWeeks = DEFAULT_USER_SETTINGS.staleAfterWeeks,
  recentSessions,
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

      {!isLoading && onUpdateGameStatus && (
        <>
          <StartedBacklogNotice games={filteredGames} onUpdateGameStatus={onUpdateGameStatus} />
          <StaleInProgressNotice games={filteredGames} staleAfterWeeks={staleAfterWeeks} onUpdateGameStatus={onUpdateGameStatus} />
          <AcquiredWishlistNotice
            games={filteredGames}
            wishlistIds={wishlistIds}
            onUpdateGameStatus={onUpdateGameStatus}
            onToggleWishlist={onToggleWishlist}
          />
        </>
      )}

      {isLoading ? (
        <LibrarySkeleton />
      ) : filteredGames.length > 0 ? (
        <LibraryStatusSections
          games={filteredGames}
          onUpdateGameStatus={onUpdateGameStatus}
          onPlayNext={onPlayNext}
          onRemoveFromQueue={onRemoveFromQueue}
          onReorderQueue={onReorderQueue}
          backlogDurations={backlogDurations}
          recentSessions={recentSessions}
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
