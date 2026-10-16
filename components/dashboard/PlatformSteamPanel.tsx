// components/dashboard/PlatformSteamPanel.tsx
"use client";

import type { PlatformAccount } from "@/lib/types";
import { SteamProfileCard } from "./steam-panel/SteamProfileCard";
import { SteamSyncForm } from "./steam-panel/SteamSyncForm";
import { SteamStatsCards } from "./steam-panel/SteamStatsCards";

interface PlatformSteamPanelProps {
  steamAccount?: PlatformAccount;
  displayName: string;
  platformCounts: Record<string, number>;
  steamInput: string;
  setSteamInput: (val: string) => void;
  steamApiKey: string;
  setSteamApiKey: (val: string) => void;
  showApiKeyInput: boolean;
  setShowApiKeyInput: (val: boolean) => void;
  isSyncingSteam: boolean;
  syncProgressText: string | null;
  onConnectAndSyncSteam: () => void;
  onBackToAll: () => void;
}

export default function PlatformSteamPanel({
  steamAccount,
  displayName,
  platformCounts,
  steamInput,
  setSteamInput,
  steamApiKey,
  setSteamApiKey,
  showApiKeyInput,
  setShowApiKeyInput,
  isSyncingSteam,
  syncProgressText,
  onConnectAndSyncSteam,
  onBackToAll,
}: PlatformSteamPanelProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToAll}
          className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
        >
          ← Retour à la Vue Globale
        </button>
        <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg border border-sky-500/40 bg-sky-500/10 text-sky-300">
          Espace Dédié Steam
        </span>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/95 to-sky-950/40 p-5 sm:p-6 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <SteamProfileCard steamAccount={steamAccount} displayName={displayName} />
          <SteamSyncForm
            steamInput={steamInput}
            setSteamInput={setSteamInput}
            steamApiKey={steamApiKey}
            setSteamApiKey={setSteamApiKey}
            showApiKeyInput={showApiKeyInput}
            setShowApiKeyInput={setShowApiKeyInput}
            isSyncingSteam={isSyncingSteam}
            syncProgressText={syncProgressText}
            onConnectAndSyncSteam={onConnectAndSyncSteam}
          />
        </div>
      </div>

      <SteamStatsCards steamAccount={steamAccount} platformCounts={platformCounts} />
    </div>
  );
}
