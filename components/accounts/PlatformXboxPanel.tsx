// components/accounts/PlatformXboxPanel.tsx

"use client";

import type { UserAccountProfile, PlatformType } from "@/lib/types";
import { XboxProfileCard } from "./xbox-panel/XboxProfileCard";
import { XboxSyncForm } from "./xbox-panel/XboxSyncForm";
import { XboxStatsCards } from "./xbox-panel/XboxStatsCards";
import { PlatformCollectionLink } from "./PlatformCollectionLink";

interface PlatformXboxPanelProps {
  accountProfile: UserAccountProfile;
  platformCounts: Record<string, number>;
  xboxInput: string;
  setXboxInput: (val: string) => void;
  xboxApiKey: string;
  setXboxApiKey: (val: string) => void;
  showXboxApiKey: boolean;
  setShowXboxApiKey: (val: boolean) => void;
  isSyncingXbox: boolean;
  onConnectAndSyncXbox: () => void;
  openEditPlatform: (plat: PlatformType) => void;
  handleDisconnectPlatform: (plat: PlatformType) => void;
  gameCount: number;
}

export default function PlatformXboxPanel({
  accountProfile,
  platformCounts,
  xboxInput,
  setXboxInput,
  xboxApiKey,
  setXboxApiKey,
  showXboxApiKey,
  setShowXboxApiKey,
  isSyncingXbox,
  onConnectAndSyncXbox,
  openEditPlatform,
  handleDisconnectPlatform,
  gameCount,
}: PlatformXboxPanelProps) {
  const xboxAccount = accountProfile.accounts.xbox;

  return (
    <div className="space-y-4">
      <PlatformCollectionLink platform="xbox" gameCount={gameCount} />

      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-900 via-slate-900/95 to-emerald-950/40 p-5 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <XboxProfileCard
            xboxAccount={xboxAccount}
            openEditPlatform={openEditPlatform}
            handleDisconnectPlatform={handleDisconnectPlatform}
          />
          <XboxSyncForm
            xboxInput={xboxInput}
            setXboxInput={setXboxInput}
            xboxApiKey={xboxApiKey}
            setXboxApiKey={setXboxApiKey}
            showXboxApiKey={showXboxApiKey}
            setShowXboxApiKey={setShowXboxApiKey}
            isSyncingXbox={isSyncingXbox}
            onConnectAndSyncXbox={onConnectAndSyncXbox}
          />
        </div>
      </div>

      <XboxStatsCards
        xboxAccount={xboxAccount}
        platformCounts={platformCounts}
      />
    </div>
  );
}
