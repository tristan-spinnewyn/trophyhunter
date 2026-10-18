// components/dashboard/DashboardActiveTabSection.tsx

import ActiveTabPanel from "./ActiveTabPanel";
import type {
  useAccountDashboardController,
  AccountDashboardControllerParams,
} from "./hooks/useAccountDashboardController";

interface DashboardActiveTabSectionProps {
  readonly controller: ReturnType<typeof useAccountDashboardController>;
  readonly props: AccountDashboardControllerParams;
}

export function DashboardActiveTabSection({
  controller: c,
  props,
}: DashboardActiveTabSectionProps) {
  const { platformInputs: pi, collectionsState: cs, platformSync: ps, libraryFilters: lf, stats } = c;

  return (
    <ActiveTabPanel
      activePlatformTab={c.activePlatformTab}
      globalStats={stats.globalStats}
      accountProfile={props.accountProfile}
      ownedGames={props.ownedGames}
      wishlistIds={cs.wishlistIds}
      platformCounts={stats.platformCounts}
      duplicateGroups={stats.duplicateGroups}
      epicCounts={stats.epicCounts}
      libAchievementFilter={lf.libAchievementFilter}
      setLibAchievementFilter={lf.setLibAchievementFilter}
      onSelectTab={c.handleSelectTab}
      openEditPlatform={ps.openEditPlatform}
      handleDisconnectPlatform={ps.handleDisconnectPlatform}
      onSelectGame={props.onSelectGame}
      onAddGamePassToXbox={c.handleAddGamePassToXbox}
      onToggleWishlist={cs.handleToggleWishlist}
      collections={cs.collections}
      selectedCollId={cs.selectedCollId}
      setSelectedCollId={cs.setSelectedCollId}
      isCreatingColl={cs.isCreatingColl}
      setIsCreatingColl={cs.setIsCreatingColl}
      newCollName={cs.newCollName}
      setNewCollName={cs.setNewCollName}
      newCollDesc={cs.newCollDesc}
      setNewCollDesc={cs.setNewCollDesc}
      handleCreateCollection={cs.handleCreateCollection}
      handleDeleteCollection={cs.handleDeleteCollection}
      displayName={c.displayName}
      steamInput={pi.steamInput}
      setSteamInput={pi.setSteamInput}
      steamApiKey={pi.steamApiKey}
      setSteamApiKey={pi.setSteamApiKey}
      showApiKeyInput={pi.showApiKeyInput}
      setShowApiKeyInput={pi.setShowApiKeyInput}
      isSyncingSteam={ps.isSyncingSteam}
      syncProgressText={ps.syncProgressText}
      handleConnectAndSyncSteam={ps.handleConnectAndSyncSteam}
      xboxInput={pi.xboxInput}
      setXboxInput={pi.setXboxInput}
      xboxApiKey={pi.xboxApiKey}
      setXboxApiKey={pi.setXboxApiKey}
      showXboxApiKey={pi.showXboxApiKey}
      setShowXboxApiKey={pi.setShowXboxApiKey}
      isSyncingXbox={ps.isSyncingXbox}
      handleConnectAndSyncXbox={ps.handleConnectAndSyncXbox}
      epicInput={pi.epicInput}
      setEpicInput={pi.setEpicInput}
      epicCode={pi.epicCode}
      setEpicCode={pi.setEpicCode}
      showEpicCode={pi.showEpicCode}
      setShowEpicCode={pi.setShowEpicCode}
      isSyncingEpic={ps.isSyncingEpic}
      handleConnectAndSyncEpic={ps.handleConnectAndSyncEpic}
      handleScanEpicAchievements={ps.handleScanEpicAchievements}
      handleCleanEpicGames={() =>
        ps.handleCleanEpicGames(stats.epicCounts.noAch, stats.epicCounts.withAch)
      }
      onOpenEpicModal={ps.openEpicAuthModalForLibrary}
      gogInput={pi.gogInput}
      setGogInput={pi.setGogInput}
      gogToken={pi.gogToken}
      setGogToken={pi.setGogToken}
      showGogToken={pi.showGogToken}
      setShowGogToken={pi.setShowGogToken}
      isSyncingGOG={ps.isSyncingGOG}
      handleConnectAndSyncGOG={ps.handleConnectAndSyncGOG}
    />
  );
}
