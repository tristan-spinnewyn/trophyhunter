// components/dashboard/PlatformGogPanel.tsx

"use client";

import type { UserAccountProfile, PlatformType } from "@/lib/types";
import { GogProfileCard } from "./gog-panel/GogProfileCard";
import { GogSyncForm } from "./gog-panel/GogSyncForm";
import { GogStatsCards } from "./gog-panel/GogStatsCards";

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
  onBackToAll: () => void;
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
  onBackToAll,
}: PlatformGogPanelProps) {
  const gogAccount = accountProfile.accounts.gog;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToAll}
          className="text-xs text-violet-400 hover:text-violet-300 font-semibold flex items-center gap-1"
        >
          ← Retour à la Vue Globale
        </button>
        <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg border border-violet-500/40 bg-violet-500/10 text-violet-300">
          Espace Dédié GOG Galaxy & Web API
        </span>
      </div>

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
