// components/dashboard/active-tab/ActiveTabPanel.types.ts

import type {
  UserAccountProfile,
  PlatformType,
  OwnedGame,
} from "@/lib/types";
import type { LocalCollection } from "@/lib/storage";
import type { DashboardTabType } from "@/components/dashboard/DashboardNavTabs";
import type {
  GlobalDashboardStats,
  EpicGameCounts,
} from "@/components/dashboard/hooks/useDashboardStats";
import type { AchievementFilterType } from "@/components/dashboard/hooks/useLibraryFilters";

export interface ActiveTabPanelProps {
  activePlatformTab: DashboardTabType;
  globalStats: GlobalDashboardStats;
  accountProfile: UserAccountProfile;
  platformCounts: Record<string, number>;
  duplicateGroups: Array<{ title: string; games: OwnedGame[] }>;
  epicCounts: EpicGameCounts;
  libAchievementFilter: AchievementFilterType;
  setLibAchievementFilter: (val: AchievementFilterType) => void;
  onSelectTab: (tab: DashboardTabType) => void;
  openEditPlatform: (plat: PlatformType) => void;
  handleDisconnectPlatform: (plat: PlatformType) => void;
  onSelectGame: (appId: number) => void;

  // Collections
  collections: LocalCollection[];
  selectedCollId: string | null;
  setSelectedCollId: (id: string | null) => void;
  isCreatingColl: boolean;
  setIsCreatingColl: (val: boolean) => void;
  newCollName: string;
  setNewCollName: (val: string) => void;
  newCollDesc: string;
  setNewCollDesc: (val: string) => void;
  handleCreateCollection: () => Promise<void>;
  handleDeleteCollection: (collId: string) => Promise<void>;

  // Steam
  displayName: string;
  steamInput: string;
  setSteamInput: (val: string) => void;
  steamApiKey: string;
  setSteamApiKey: (val: string) => void;
  showApiKeyInput: boolean;
  setShowApiKeyInput: (val: boolean) => void;
  isSyncingSteam: boolean;
  syncProgressText: string | null;
  handleConnectAndSyncSteam: () => Promise<void>;

  // Xbox
  xboxInput: string;
  setXboxInput: (val: string) => void;
  xboxApiKey: string;
  setXboxApiKey: (val: string) => void;
  showXboxApiKey: boolean;
  setShowXboxApiKey: (val: boolean) => void;
  isSyncingXbox: boolean;
  handleConnectAndSyncXbox: () => Promise<void>;

  // Epic
  epicInput: string;
  setEpicInput: (val: string) => void;
  epicCode: string;
  setEpicCode: (val: string) => void;
  showEpicCode: boolean;
  setShowEpicCode: (val: boolean) => void;
  isSyncingEpic: boolean;
  handleConnectAndSyncEpic: () => Promise<void>;
  handleScanEpicAchievements: () => Promise<void>;
  handleCleanEpicGames: () => Promise<void>;
  onOpenEpicModal?: () => void;

  // GOG
  gogInput: string;
  setGogInput: (val: string) => void;
  gogToken: string;
  setGogToken: (val: string) => void;
  showGogToken: boolean;
  setShowGogToken: (val: boolean) => void;
  isSyncingGOG: boolean;
  handleConnectAndSyncGOG: () => Promise<void>;
}
