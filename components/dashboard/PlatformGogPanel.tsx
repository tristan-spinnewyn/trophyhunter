// components/dashboard/PlatformGogPanel.tsx

"use client";

import type { UserAccountProfile, PlatformType } from "@/lib/types";
import { GogProfileCard } from "./gog-panel/GogProfileCard";
import { GogSyncForm } from "./gog-panel/GogSyncForm";
import { GogStatsCards } from "./gog-panel/GogStatsCards";
import { PlatformCollectionLink } from "./PlatformCollectionLink";

interface PlatformGogPanelProps {
  accountProfile: UserAccountProfile;
  platformCounts: Record<string, number>;
  gogInput: string;
  setGogInput: (val: string) => void;
  gogToken: string;
  setGogToken: (val: string) => void;
  showGogToken: boolean;
  setShowGogToken: (val: boolean) => void;
  isSyncingGOG: boolean;
  onConnectAndSyncGOG: () => void;
  openEditPlatform: (plat: PlatformType) => void;
  handleDisconnectPlatform: (plat: PlatformType) => void;
  gameCount: number;
}

export default function PlatformGogPanel({
  accountProfile,
  platformCounts,
  gogInput,
  setGogInput,
  gogToken,
  setGogToken,
  showGogToken,
  setShowGogToken,
  isSyncingGOG,
  onConnectAndSyncGOG,
  openEditPlatform,
  handleDisconnectPlatform,
  gameCount,
}: PlatformGogPanelProps) {
  const gogAccount = accountProfile.accounts.gog;

  return (
    <div className="space-y-4">
      <PlatformCollectionLink platform="gog" gameCount={gameCount} />

      <div className="relative overflow-hidden rounded-2xl border border-violet-500/30 bg-gradient-to-br from-slate-900 via-slate-900/95 to-violet-950/40 p-5 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <GogProfileCard
            gogAccount={gogAccount}
            openEditPlatform={openEditPlatform}
            handleDisconnectPlatform={handleDisconnectPlatform}
          />
          <GogSyncForm
            gogInput={gogInput}
            setGogInput={setGogInput}
            gogToken={gogToken}
            setGogToken={setGogToken}
            showGogToken={showGogToken}
            setShowGogToken={setShowGogToken}
            isSyncingGOG={isSyncingGOG}
            onConnectAndSyncGOG={onConnectAndSyncGOG}
          />
        </div>
      </div>

      <GogStatsCards
        gogAccount={gogAccount}
        platformCounts={platformCounts}
      />
    </div>
  );
}
