// components/dashboard/ActiveTabPanel.tsx

import OverviewPanel from "@/components/dashboard/OverviewPanel";
import DuplicatesPanel from "@/components/dashboard/DuplicatesPanel";
import CollectionsPanel from "@/components/dashboard/CollectionsPanel";
import GamePassPanel from "@/components/dashboard/GamePassPanel";
import type { DashboardSectionProps } from "./hooks/useAccountDashboardController";
import { PlatformTabSwitcher } from "./active-tab/PlatformTabSwitcher";

export default function ActiveTabPanel({ controller: c, props }: DashboardSectionProps) {
  const { collectionsState: cs, platformSync: ps, stats } = c;
  const onSelectTab = c.handleSelectTab;

  if (c.activePlatformTab === "all") {
    return (
      <OverviewPanel
        globalStats={stats.globalStats}
        accountProfile={props.accountProfile}
        platformCounts={stats.platformCounts}
        onSelectPlatform={onSelectTab}
        onEditPlatform={ps.openEditPlatform}
        onDisconnectPlatform={ps.handleDisconnectPlatform}
        onSelectGame={props.onSelectGame}
      />
    );
  }

  if (c.activePlatformTab === "gamepass") {
    return (
      <GamePassPanel
        ownedGames={props.ownedGames}
        wishlistIds={cs.wishlistIds}
        onAddGameToXbox={c.handleAddGamePassToXbox}
        onToggleWishlist={cs.handleToggleWishlist}
        onSelectGame={(appId) => props.onSelectGame(appId)}
        onBackToAll={() => onSelectTab("all")}
      />
    );
  }

  if (c.activePlatformTab === "duplicates") {
    return (
      <DuplicatesPanel
        duplicateGroups={stats.duplicateGroups}
        onSelectGame={props.onSelectGame}
        onBackToAll={() => onSelectTab("all")}
      />
    );
  }

  if (c.activePlatformTab === "collections") {
    return (
      <CollectionsPanel
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
        onBackToAll={() => onSelectTab("all")}
      />
    );
  }

  return <PlatformTabSwitcher controller={c} props={props} />;
}
