// components/dashboard/PlatformXboxPanel.tsx

"use client";

import type { UserAccountProfile, PlatformType } from "@/lib/types";
import { XboxProfileCard } from "./xbox-panel/XboxProfileCard";
import { XboxSyncForm } from "./xbox-panel/XboxSyncForm";
import { XboxStatsCards } from "./xbox-panel/XboxStatsCards";

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
  onBackToAll: () => void;
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
  onBackToAll,
}: PlatformXboxPanelProps) {
  const xboxAccount = accountProfile.accounts.xbox;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToAll}
          className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
        >
          ← Retour à la Vue Globale
        </button>
        <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-300">
          Espace Dédié Xbox Live & PC Game Pass
        </span>
      </div>

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
