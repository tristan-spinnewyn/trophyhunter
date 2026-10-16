// components/dashboard/PlatformEpicPanel.types.ts

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
