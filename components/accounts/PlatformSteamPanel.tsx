// components/accounts/PlatformSteamPanel.tsx
"use client";

import type { PlatformAccount } from "@/lib/types";
import { SteamProfileCard } from "./steam-panel/SteamProfileCard";
import { SteamSyncForm } from "./steam-panel/SteamSyncForm";
import { SteamStatsCards } from "./steam-panel/SteamStatsCards";
import { PlatformCollectionLink } from "./PlatformCollectionLink";

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
  gameCount: number;
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
  gameCount,
}: PlatformSteamPanelProps) {
  return (
    <div className="space-y-4">
      <PlatformCollectionLink platform="steam" gameCount={gameCount} />

      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/95 to-sky-950/40 p-5 sm:p-6">
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
