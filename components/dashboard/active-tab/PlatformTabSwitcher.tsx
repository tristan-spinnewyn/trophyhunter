// components/dashboard/active-tab/PlatformTabSwitcher.tsx

import PlatformSteamPanel from "@/components/dashboard/PlatformSteamPanel";
import PlatformXboxPanel from "@/components/dashboard/PlatformXboxPanel";
import PlatformEpicPanel from "@/components/dashboard/PlatformEpicPanel";
import PlatformGogPanel from "@/components/dashboard/PlatformGogPanel";
import type { ActiveTabPanelProps } from "./ActiveTabPanel.types";

export function PlatformTabSwitcher(props: ActiveTabPanelProps) {
  const { activePlatformTab, accountProfile, platformCounts, onSelectTab } = props;
  const steamAccount = accountProfile.accounts.steam;
  const back = () => onSelectTab("all");

  if (activePlatformTab === "steam") {
    return (
      <PlatformSteamPanel
        steamAccount={steamAccount} displayName={props.displayName}
        platformCounts={platformCounts} steamInput={props.steamInput}
        setSteamInput={props.setSteamInput} steamApiKey={props.steamApiKey}
        setSteamApiKey={props.setSteamApiKey} showApiKeyInput={props.showApiKeyInput}
        setShowApiKeyInput={props.setShowApiKeyInput} isSyncingSteam={props.isSyncingSteam}
        syncProgressText={props.syncProgressText} onConnectAndSyncSteam={props.handleConnectAndSyncSteam}
        onBackToAll={back}
      />
    );
  }

  if (activePlatformTab === "xbox") {
    return (
      <PlatformXboxPanel
        accountProfile={accountProfile} platformCounts={platformCounts}
        xboxInput={props.xboxInput} setXboxInput={props.setXboxInput}
        xboxApiKey={props.xboxApiKey} setXboxApiKey={props.setXboxApiKey}
        showXboxApiKey={props.showXboxApiKey} setShowXboxApiKey={props.setShowXboxApiKey}
        isSyncingXbox={props.isSyncingXbox} onConnectAndSyncXbox={props.handleConnectAndSyncXbox}
        openEditPlatform={props.openEditPlatform} handleDisconnectPlatform={props.handleDisconnectPlatform}
        onBackToAll={back}
      />
    );
  }

  if (activePlatformTab === "epic") {
    return (
      <PlatformEpicPanel
        accountProfile={accountProfile} epicCounts={props.epicCounts}
        epicInput={props.epicInput} setEpicInput={props.setEpicInput}
        epicCode={props.epicCode} setEpicCode={props.setEpicCode}
        showEpicCode={props.showEpicCode} setShowEpicCode={props.setShowEpicCode}
        isSyncingEpic={props.isSyncingEpic} syncProgressText={props.syncProgressText}
        libAchievementFilter={props.libAchievementFilter} setLibAchievementFilter={props.setLibAchievementFilter}
        onConnectAndSyncEpic={props.handleConnectAndSyncEpic} onScanEpicAchievements={props.handleScanEpicAchievements}
        onCleanEpicGames={props.handleCleanEpicGames} openEditPlatform={props.openEditPlatform}
        handleDisconnectPlatform={props.handleDisconnectPlatform} onBackToAll={back}
        onOpenEpicModal={props.onOpenEpicModal}
      />
    );
  }

  if (activePlatformTab === "gog") {
    return (
      <PlatformGogPanel
        accountProfile={accountProfile} platformCounts={platformCounts}
        gogInput={props.gogInput} setGogInput={props.setGogInput}
        gogToken={props.gogToken} setGogToken={props.setGogToken}
        showGogToken={props.showGogToken} setShowGogToken={props.setShowGogToken}
        isSyncingGOG={props.isSyncingGOG} onConnectAndSyncGOG={props.handleConnectAndSyncGOG}
        openEditPlatform={props.openEditPlatform} handleDisconnectPlatform={props.handleDisconnectPlatform}
        onBackToAll={back}
      />
    );
  }

  return null;
}
