// components/accounts/PlatformEpicPanel.tsx

"use client";
import { EpicProfileCard } from "./epic-panel/EpicProfileCard";
import { EpicSyncForm } from "./epic-panel/EpicSyncForm";
import { EpicLibraryTools } from "./epic-panel/EpicLibraryTools";
import { EpicStatsCards } from "./epic-panel/EpicStatsCards";
import type { UserAccountProfile, PlatformType } from "@/lib/types";
import { PlatformCollectionLink } from "./PlatformCollectionLink";

export interface PlatformEpicPanelProps {
  accountProfile: UserAccountProfile;
  epicCounts: { total: number; withAch: number; noAch: number };
  epicInput: string;
  setEpicInput: (val: string) => void;
  epicCode: string;
  setEpicCode: (val: string) => void;
  showEpicCode: boolean;
  setShowEpicCode: (val: boolean) => void;
  isSyncingEpic: boolean;
  syncProgressText: string | null;
  onConnectAndSyncEpic: () => void;
  onScanEpicAchievements: () => void;
  onCleanEpicGames: () => void;
  openEditPlatform: (plat: PlatformType) => void;
  handleDisconnectPlatform: (plat: PlatformType) => void;
  gameCount: number;
  onOpenEpicModal?: () => void;
}


export default function PlatformEpicPanel({
  accountProfile,
  epicCounts,
  epicInput,
  setEpicInput,
  epicCode,
  setEpicCode,
  showEpicCode,
  setShowEpicCode,
  isSyncingEpic,
  syncProgressText,
  onConnectAndSyncEpic,
  onScanEpicAchievements,
  onCleanEpicGames,
  openEditPlatform,
  handleDisconnectPlatform,
  gameCount,
  onOpenEpicModal,
}: PlatformEpicPanelProps) {
  const epicAccount = accountProfile.accounts.epic;

  return (
    <div className="space-y-4">
      <PlatformCollectionLink platform="epic" gameCount={gameCount} />

      <div className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-br from-slate-900 via-slate-900/95 to-purple-950/40 p-5 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <EpicProfileCard
            epicAccount={epicAccount}
            openEditPlatform={openEditPlatform}
            handleDisconnectPlatform={handleDisconnectPlatform}
          />
          <EpicSyncForm
            epicInput={epicInput}
            setEpicInput={setEpicInput}
            epicCode={epicCode}
            setEpicCode={setEpicCode}
            showEpicCode={showEpicCode}
            setShowEpicCode={setShowEpicCode}
            isSyncingEpic={isSyncingEpic}
            syncProgressText={syncProgressText}
            onConnectAndSyncEpic={onConnectAndSyncEpic}
            onOpenEpicModal={onOpenEpicModal}
          />
        </div>
      </div>

      <EpicLibraryTools
        epicCounts={epicCounts}
        isSyncingEpic={isSyncingEpic}
        onScanEpicAchievements={onScanEpicAchievements}
        onCleanEpicGames={onCleanEpicGames}
      />

      <EpicStatsCards
        epicAccount={epicAccount}
        epicCounts={epicCounts}
      />
    </div>
  );
}
