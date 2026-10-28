// components/dashboard/PlatformEpicPanel.tsx

"use client";
import { EpicProfileCard } from "./epic-panel/EpicProfileCard";
import { EpicSyncForm } from "./epic-panel/EpicSyncForm";
import { EpicAchievementsFilterBar } from "./epic-panel/EpicAchievementsFilterBar";
import { EpicStatsCards } from "./epic-panel/EpicStatsCards";
import type { UserAccountProfile, PlatformType } from "@/lib/types";

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
  libAchievementFilter: "all" | "with-achievements" | "no-achievements";
  setLibAchievementFilter: (val: "all" | "with-achievements" | "no-achievements") => void;
  onConnectAndSyncEpic: () => void;
  onScanEpicAchievements: () => void;
  onCleanEpicGames: () => void;
  openEditPlatform: (plat: PlatformType) => void;
  handleDisconnectPlatform: (plat: PlatformType) => void;
  onBackToAll: () => void;
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
  libAchievementFilter,
  setLibAchievementFilter,
  onConnectAndSyncEpic,
  onScanEpicAchievements,
  onCleanEpicGames,
  openEditPlatform,
  handleDisconnectPlatform,
  onBackToAll,
  onOpenEpicModal,
}: PlatformEpicPanelProps) {
  const epicAccount = accountProfile.accounts.epic;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToAll}
          className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
        >
          ← Retour à la Vue Globale
        </button>
        <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg border border-purple-500/40 bg-purple-500/10 text-purple-300">
          Espace Dédié Epic Games Store
        </span>
      </div>

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

      <EpicAchievementsFilterBar
        epicCounts={epicCounts}
        libAchievementFilter={libAchievementFilter}
        setLibAchievementFilter={setLibAchievementFilter}
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
