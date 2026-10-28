// app/game/[id]/components/GameClientSidebar.tsx
"use client";

import ProgressTracker from "@/components/progress/ProgressTracker";
import { GameSyncNotice } from "./GameSyncNotice";
import type { GameDetails, PlatformType, UserGameProgress, UserAccountProfile } from "@/lib/types";

interface SidebarProps {
  game: GameDetails;
  progress: UserGameProgress;
  importedUnlockedCount?: number;
  onResetProgress: () => void;
  onSync: () => void;
  isSyncing: boolean;
  activePlatform: PlatformType;
  accountProfile: UserAccountProfile;
  steamUser: string;
  openEpicAuthModal: () => void;
  syncNotice: { type: "success" | "error"; msg: string } | null;
}

export function GameClientSidebar({
  game,
  progress,
  importedUnlockedCount,
  onResetProgress,
  onSync,
  isSyncing,
  activePlatform,
  accountProfile,
  steamUser,
  openEpicAuthModal,
  syncNotice,
}: SidebarProps) {
  const isPlatformConnected =
    activePlatform === "epic" ? !!accountProfile.accounts.epic : !!steamUser;

  return (
    <div className="lg:col-span-4 lg:sticky lg:top-20 space-y-4">
      <ProgressTracker
        total={game.totalAchievements}
        unlockedCount={progress.unlockedIds.length}
        importedUnlockedCount={importedUnlockedCount}
        onReset={onResetProgress}
        onSync={onSync}
        isSyncing={isSyncing}
        platform={activePlatform}
        platformConnected={isPlatformConnected}
        hasSteamUser={!!steamUser}
        onOpenEpicModal={openEpicAuthModal}
      />

      <GameSyncNotice notice={syncNotice} />
    </div>
  );
}
