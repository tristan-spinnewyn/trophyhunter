// components/accounts/active-tab/PlatformTabSwitcher.tsx

import PlatformSteamPanel from "@/components/accounts/PlatformSteamPanel";
import PlatformXboxPanel from "@/components/accounts/PlatformXboxPanel";
import PlatformEpicPanel from "@/components/accounts/PlatformEpicPanel";
import PlatformGogPanel from "@/components/accounts/PlatformGogPanel";
import type { DashboardSectionProps } from "../hooks/useAccountDashboardController";

export function PlatformTabSwitcher({ controller: c, props }: DashboardSectionProps) {
  const { platformInputs: pi, platformSync: ps, stats } = c;
  const { accountProfile } = props;
  const platformCounts = stats.platformCounts;

  if (c.activePlatformTab === "steam") {
    return (
      <PlatformSteamPanel
        steamAccount={accountProfile.accounts.steam} displayName={c.displayName}
        platformCounts={platformCounts} steamInput={pi.steamInput}
        setSteamInput={pi.setSteamInput} steamApiKey={pi.steamApiKey}
        setSteamApiKey={pi.setSteamApiKey} showApiKeyInput={pi.showApiKeyInput}
        setShowApiKeyInput={pi.setShowApiKeyInput} isSyncingSteam={ps.isSyncingSteam}
        syncProgressText={ps.syncProgressText} onConnectAndSyncSteam={ps.handleConnectAndSyncSteam}
        gameCount={platformCounts.steam || 0}
      />
    );
  }

  if (c.activePlatformTab === "xbox") {
    return (
      <PlatformXboxPanel
        accountProfile={accountProfile} platformCounts={platformCounts}
        xboxInput={pi.xboxInput} setXboxInput={pi.setXboxInput}
        xboxApiKey={pi.xboxApiKey} setXboxApiKey={pi.setXboxApiKey}
        showXboxApiKey={pi.showXboxApiKey} setShowXboxApiKey={pi.setShowXboxApiKey}
        isSyncingXbox={ps.isSyncingXbox} onConnectAndSyncXbox={ps.handleConnectAndSyncXbox}
        openEditPlatform={ps.openEditPlatform} handleDisconnectPlatform={ps.handleDisconnectPlatform}
        gameCount={platformCounts.xbox || 0}
      />
    );
  }

  if (c.activePlatformTab === "epic") {
    return (
      <PlatformEpicPanel
        accountProfile={accountProfile} epicCounts={stats.epicCounts}
        epicInput={pi.epicInput} setEpicInput={pi.setEpicInput}
        epicCode={pi.epicCode} setEpicCode={pi.setEpicCode}
        showEpicCode={pi.showEpicCode} setShowEpicCode={pi.setShowEpicCode}
        isSyncingEpic={ps.isSyncingEpic} syncProgressText={ps.syncProgressText}
        onConnectAndSyncEpic={ps.handleConnectAndSyncEpic} onScanEpicAchievements={ps.handleScanEpicAchievements}
        onCleanEpicGames={() => ps.handleCleanEpicGames(stats.epicCounts.noAch, stats.epicCounts.withAch)}
        openEditPlatform={ps.openEditPlatform}
        handleDisconnectPlatform={ps.handleDisconnectPlatform} gameCount={platformCounts.epic || 0}
        onOpenEpicModal={ps.openEpicAuthModalForLibrary}
      />
    );
  }

  if (c.activePlatformTab === "gog") {
    return (
      <PlatformGogPanel
        accountProfile={accountProfile} platformCounts={platformCounts}
        gogInput={pi.gogInput} setGogInput={pi.setGogInput}
        gogToken={pi.gogToken} setGogToken={pi.setGogToken}
        showGogToken={pi.showGogToken} setShowGogToken={pi.setShowGogToken}
        isSyncingGOG={ps.isSyncingGOG} onConnectAndSyncGOG={ps.handleConnectAndSyncGOG}
        openEditPlatform={ps.openEditPlatform} handleDisconnectPlatform={ps.handleDisconnectPlatform}
        gameCount={platformCounts.gog || 0}
      />
    );
  }

  return null;
}
