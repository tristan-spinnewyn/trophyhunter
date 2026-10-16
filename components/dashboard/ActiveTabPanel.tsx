// components/dashboard/ActiveTabPanel.tsx

import OverviewPanel from "@/components/dashboard/OverviewPanel";
import DuplicatesPanel from "@/components/dashboard/DuplicatesPanel";
import CollectionsPanel from "@/components/dashboard/CollectionsPanel";
import type { ActiveTabPanelProps } from "./active-tab/ActiveTabPanel.types";
import { PlatformTabSwitcher } from "./active-tab/PlatformTabSwitcher";

export type { ActiveTabPanelProps };

export default function ActiveTabPanel(props: ActiveTabPanelProps) {
  const { activePlatformTab, onSelectTab } = props;

  if (activePlatformTab === "all") {
    return (
      <OverviewPanel
        globalStats={props.globalStats}
        accountProfile={props.accountProfile}
        platformCounts={props.platformCounts}
        onSelectPlatform={onSelectTab}
        onEditPlatform={props.openEditPlatform}
        onDisconnectPlatform={props.handleDisconnectPlatform}
        onSelectGame={props.onSelectGame}
      />
    );
  }

  if (activePlatformTab === "duplicates") {
    return (
      <DuplicatesPanel
        duplicateGroups={props.duplicateGroups}
        onSelectGame={props.onSelectGame}
        onBackToAll={() => onSelectTab("all")}
      />
    );
  }

  if (activePlatformTab === "collections") {
    return (
      <CollectionsPanel
        collections={props.collections}
        selectedCollId={props.selectedCollId}
        setSelectedCollId={props.setSelectedCollId}
        isCreatingColl={props.isCreatingColl}
        setIsCreatingColl={props.setIsCreatingColl}
        newCollName={props.newCollName}
        setNewCollName={props.setNewCollName}
        newCollDesc={props.newCollDesc}
        setNewCollDesc={props.setNewCollDesc}
        handleCreateCollection={props.handleCreateCollection}
        handleDeleteCollection={props.handleDeleteCollection}
        onBackToAll={() => onSelectTab("all")}
      />
    );
  }

  return <PlatformTabSwitcher {...props} />;
}
