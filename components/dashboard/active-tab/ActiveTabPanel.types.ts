// components/dashboard/active-tab/ActiveTabPanel.types.ts

import type {
  UserAccountProfile,
  PlatformType,
  OwnedGame,
} from "@/lib/types";
import type { CollectionWithGames } from "@/lib/types";
import type { LibraryTab, AchievementFilterType } from "@/lib/library/library-filters";
import type { GamePassCatalogItem } from "@/lib/gamepass/gamepass.types";
import type { GlobalDashboardStats, EpicGameCounts } from "@/lib/library/library-stats";

export interface ActiveTabPanelProps {
  activePlatformTab: LibraryTab;
  globalStats: GlobalDashboardStats;
  accountProfile: UserAccountProfile;
  ownedGames: readonly OwnedGame[];
  wishlistIds: readonly number[];
  platformCounts: Record<string, number>;
  duplicateGroups: Array<{ title: string; games: OwnedGame[] }>;
  epicCounts: EpicGameCounts;
  libAchievementFilter: AchievementFilterType;
  setLibAchievementFilter: (val: AchievementFilterType) => void;
  onSelectTab: (tab: LibraryTab) => void;
  openEditPlatform: (plat: PlatformType) => void;
  handleDisconnectPlatform: (plat: PlatformType) => void;
  onSelectGame: (appId: number) => void;
  onAddGamePassToXbox: (item: GamePassCatalogItem) => Promise<void>;
  onToggleWishlist: (appId: number, platform: PlatformType) => Promise<void>;

  collections: CollectionWithGames[];
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

  xboxInput: string;
  setXboxInput: (val: string) => void;
  xboxApiKey: string;
  setXboxApiKey: (val: string) => void;
  showXboxApiKey: boolean;
  setShowXboxApiKey: (val: boolean) => void;
  isSyncingXbox: boolean;
  handleConnectAndSyncXbox: () => Promise<void>;

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

  gogInput: string;
  setGogInput: (val: string) => void;
  gogToken: string;
  setGogToken: (val: string) => void;
  showGogToken: boolean;
  setShowGogToken: (val: boolean) => void;
  isSyncingGOG: boolean;
  handleConnectAndSyncGOG: () => Promise<void>;
}
