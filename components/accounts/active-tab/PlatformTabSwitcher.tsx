// components/accounts/active-tab/PlatformTabSwitcher.tsx

import type { PlatformType } from "@/lib/types";
import { ALL_PLATFORMS } from "@/lib/platforms";
import { PlatformConnectionPanel, type PlatformConnectionPanelProps } from "../PlatformConnectionPanel";
import { EpicLibraryTools } from "../EpicLibraryTools";
import type { DashboardSectionProps } from "../hooks/useAccountDashboardController";

type PlatformFields = Pick<
  PlatformConnectionPanelProps,
  "identifier" | "onIdentifierChange" | "secret" | "onSecretChange" | "isSyncing" | "onSync" | "onOpenGuidedAuth" | "extra"
>;

/** Maps the controller's per-platform inputs and actions onto the shared connection panel. */
function platformFields(platform: PlatformType, { controller: c }: DashboardSectionProps): PlatformFields {
  const { platformInputs: pi, platformSync: ps, stats } = c;

  switch (platform) {
    case "steam":
      return {
        identifier: pi.steamInput, onIdentifierChange: pi.setSteamInput,
        secret: pi.steamApiKey, onSecretChange: pi.setSteamApiKey,
        isSyncing: ps.isSyncingSteam, onSync: () => ps.handleConnectAndSyncSteam(),
      };
    case "xbox":
      return {
        identifier: pi.xboxInput, onIdentifierChange: pi.setXboxInput,
        secret: pi.xboxApiKey, onSecretChange: pi.setXboxApiKey,
        isSyncing: ps.isSyncingXbox, onSync: () => ps.handleConnectAndSyncXbox(),
      };
    case "epic":
      return {
        identifier: pi.epicInput, onIdentifierChange: pi.setEpicInput,
        secret: pi.epicCode, onSecretChange: pi.setEpicCode,
        isSyncing: ps.isSyncingEpic, onSync: () => ps.handleConnectAndSyncEpic(),
        onOpenGuidedAuth: ps.openEpicAuthModalForLibrary,
        extra: (
          <EpicLibraryTools
            epicCounts={stats.epicCounts}
            isSyncingEpic={ps.isSyncingEpic}
            onScanEpicAchievements={ps.handleScanEpicAchievements}
            onCleanEpicGames={() => ps.handleCleanEpicGames(stats.epicCounts.noAch, stats.epicCounts.withAch)}
          />
        ),
      };
    case "gog":
      return {
        identifier: pi.gogInput, onIdentifierChange: pi.setGogInput,
        secret: pi.gogToken, onSecretChange: pi.setGogToken,
        isSyncing: ps.isSyncingGOG, onSync: () => ps.handleConnectAndSyncGOG(),
      };
  }
}

function isPlatform(tab: string): tab is PlatformType {
  return (ALL_PLATFORMS as readonly string[]).includes(tab);
}

export function PlatformTabSwitcher(section: DashboardSectionProps) {
  const { controller: c, props } = section;
  const platform = c.activePlatformTab;
  if (!isPlatform(platform)) return null;

  return (
    <PlatformConnectionPanel
      key={platform}
      platform={platform}
      account={props.accountProfile.accounts[platform]}
      gameCount={c.stats.platformCounts[platform] || 0}
      syncProgressText={c.platformSync.syncProgressText}
      onEdit={c.platformSync.openEditPlatform}
      onDisconnect={c.platformSync.handleDisconnectPlatform}
      {...platformFields(platform, section)}
    />
  );
}
