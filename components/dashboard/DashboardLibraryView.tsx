// components/dashboard/DashboardLibraryView.tsx

import LibrarySection from "./library-section/LibrarySection";
import type {
  useAccountDashboardController,
  AccountDashboardControllerParams,
} from "./hooks/useAccountDashboardController";

interface DashboardLibraryViewProps {
  readonly controller: ReturnType<typeof useAccountDashboardController>;
  readonly props: AccountDashboardControllerParams;
}

export function DashboardLibraryView({
  controller: c,
  props,
}: DashboardLibraryViewProps) {
  const { platformInputs: pi, collectionsState: cs, platformSync: ps, addGameFlow: ag, stats, libraryFilters: lf } = c;

  return (
    <LibrarySection
      activePlatformTab={c.activePlatformTab}
      filteredGames={lf.filteredGames}
      totalOwnedGamesCount={props.ownedGames.length}
      platformGameCount={stats.platformCounts[c.activePlatformTab] || 0}
      steamAccount={c.steamAccount}
      onOpenAddGame={() => ag.setIsAddGameOpen(true)}
      onAddApiKeyClick={() => {
        pi.setShowApiKeyInput(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
      libSearch={lf.libSearch}
      setLibSearch={lf.setLibSearch}
      libPlatformFilter={lf.libPlatformFilter}
      setLibPlatformFilter={lf.setLibPlatformFilter}
      libStatusFilter={lf.libStatusFilter}
      setLibStatusFilter={lf.setLibStatusFilter}
      libAchievementFilter={lf.libAchievementFilter}
      setLibAchievementFilter={lf.setLibAchievementFilter}
      libSortOrder={lf.libSortOrder}
      setLibSortOrder={lf.setLibSortOrder}
      selectedCollId={cs.selectedCollId}
      wishlistIds={cs.wishlistIds}
      collections={cs.collections}
      onSelectGame={props.onSelectGame}
      onToggleWishlist={cs.handleToggleWishlist}
      onOpenAddToCollection={cs.setGameToAddToColl}
      onRemoveFromCollection={cs.handleRemoveGameFromColl}
      onSyncGame={ps.handleSyncGame}
      onRemoveGame={ps.handleRemoveGame}
      onUpdateGameStatus={ps.handleUpdateGameStatus}
      onConnectAndSyncSteam={ps.handleConnectAndSyncSteam}
      isSyncingSteam={ps.isSyncingSteam}
    />
  );
}
