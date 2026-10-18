// components/dashboard/OverviewPanel.tsx

"use client";

import type { UserAccountProfile, PlatformType } from "@/lib/types";
import type { GlobalDashboardStats } from "./hooks/useDashboardStats.types";
import { OverviewGlobalStats } from "./overview/OverviewGlobalStats";
import { OverviewPlatformsGrid } from "./overview/OverviewPlatformsGrid";
import { OverviewRareShowcase } from "./overview/OverviewRareShowcase";

interface OverviewPanelProps {
  readonly globalStats: GlobalDashboardStats;
  readonly accountProfile: UserAccountProfile;
  readonly platformCounts: Record<string, number>;
  readonly onSelectPlatform: (platform: PlatformType) => void;
  readonly onEditPlatform: (platform: PlatformType) => void;
  readonly onDisconnectPlatform: (platform: PlatformType) => void;
  readonly onSelectGame: (appId: number) => void;
}

export default function OverviewPanel({
  globalStats,
  accountProfile,
  platformCounts,
  onSelectPlatform,
  onEditPlatform,
  onDisconnectPlatform,
  onSelectGame,
}: OverviewPanelProps) {
  const steamAccount = accountProfile.accounts.steam;

  return (
    <>
      <OverviewGlobalStats
        globalStats={globalStats}
        steamAccount={steamAccount}
      />

      <OverviewPlatformsGrid
        accountProfile={accountProfile}
        platformCounts={platformCounts}
        onSelectPlatform={onSelectPlatform}
        onEditPlatform={onEditPlatform}
        onDisconnectPlatform={onDisconnectPlatform}
      />

      {steamAccount?.rareShowcase && (
        <OverviewRareShowcase
          rareShowcase={steamAccount.rareShowcase}
          onSelectGame={onSelectGame}
        />
      )}
    </>
  );
}
