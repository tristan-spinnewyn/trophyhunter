// components/dashboard/LibrarySection.tsx

import LibraryGameCard from "@/components/dashboard/LibraryGameCard";
import type { LibrarySectionProps } from "./library-section/LibrarySection.types";
import { LibrarySectionHeader } from "./library-section/LibrarySectionHeader";
import { LibrarySectionFilters } from "./library-section/LibrarySectionFilters";
import { LibrarySectionEmptyState } from "./library-section/LibrarySectionEmptyState";

export type { LibrarySectionProps };

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
  libStatusFilter,
  setLibStatusFilter,
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
  onConnectAndSyncSteam,
  isSyncingSteam,
}: LibrarySectionProps) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5 space-y-4">
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
        libStatusFilter={libStatusFilter}
        setLibStatusFilter={setLibStatusFilter}
        libAchievementFilter={libAchievementFilter}
        setLibAchievementFilter={setLibAchievementFilter}
        libSortOrder={libSortOrder}
        setLibSortOrder={setLibSortOrder}
      />

      {filteredGames.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredGames.map((g) => (
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
          ))}
        </div>
      ) : (
        <LibrarySectionEmptyState
          totalOwnedGamesCount={totalOwnedGamesCount}
          isSyncingSteam={isSyncingSteam}
          onConnectAndSyncSteam={onConnectAndSyncSteam}
        />
      )}
    </div>
  );
}
