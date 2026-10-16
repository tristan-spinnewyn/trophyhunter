// components/dashboard/OverviewPanel.tsx

"use client";

import type { UserAccountProfile, PlatformType } from "@/lib/types";
import { OverviewGlobalStats } from "./overview/OverviewGlobalStats";
import { OverviewPlatformsGrid } from "./overview/OverviewPlatformsGrid";
import { OverviewRareShowcase } from "./overview/OverviewRareShowcase";

interface OverviewPanelProps {
  globalStats: {
    totalGamesOwned: number;
    trackedGamesCount: number;
    totalCompletedGames: number;
    totalAchievementsUnlocked: number;
    connectedCount: number;
    avgCompletion: number;
  };
  accountProfile: UserAccountProfile;
  platformCounts: Record<string, number>;
  onSelectPlatform: (platform: PlatformType) => void;
  onEditPlatform: (platform: PlatformType) => void;
  onDisconnectPlatform: (platform: PlatformType) => void;
  onSelectGame: (appId: number) => void;
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
