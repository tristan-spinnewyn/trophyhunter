import type {
  UserAccountProfile,
  PlatformType,
  OwnedGame,
} from "@/lib/types";
import type { LocalCollection } from "@/lib/storage";
import OverviewPanel from "@/components/dashboard/OverviewPanel";
import PlatformSteamPanel from "@/components/dashboard/PlatformSteamPanel";
import PlatformXboxPanel from "@/components/dashboard/PlatformXboxPanel";
import PlatformEpicPanel from "@/components/dashboard/PlatformEpicPanel";
import PlatformGogPanel from "@/components/dashboard/PlatformGogPanel";
import DuplicatesPanel from "@/components/dashboard/DuplicatesPanel";
import CollectionsPanel from "@/components/dashboard/CollectionsPanel";
import type { DashboardTabType } from "@/components/dashboard/DashboardNavTabs";
import type {
  GlobalDashboardStats,
  EpicGameCounts,
} from "@/components/dashboard/hooks/useDashboardStats";
import type { AchievementFilterType } from "@/components/dashboard/hooks/useLibraryFilters";

interface ActiveTabPanelProps {
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

export default function ActiveTabPanel({
  activePlatformTab,
  globalStats,
  accountProfile,
  platformCounts,
  duplicateGroups,
  epicCounts,
  libAchievementFilter,
  setLibAchievementFilter,
  onSelectTab,
  openEditPlatform,
  handleDisconnectPlatform,
  onSelectGame,
  collections,
  selectedCollId,
  setSelectedCollId,
  isCreatingColl,
  setIsCreatingColl,
  newCollName,
  setNewCollName,
  newCollDesc,
  setNewCollDesc,
  handleCreateCollection,
  handleDeleteCollection,
  displayName,
  steamInput,
  setSteamInput,
  steamApiKey,
  setSteamApiKey,
  showApiKeyInput,
  setShowApiKeyInput,
  isSyncingSteam,
  syncProgressText,
  handleConnectAndSyncSteam,
  xboxInput,
  setXboxInput,
  xboxApiKey,
  setXboxApiKey,
  showXboxApiKey,
  setShowXboxApiKey,
  isSyncingXbox,
  handleConnectAndSyncXbox,
  epicInput,
  setEpicInput,
  epicCode,
  setEpicCode,
  showEpicCode,
  setShowEpicCode,
  isSyncingEpic,
  handleConnectAndSyncEpic,
  handleScanEpicAchievements,
  handleCleanEpicGames,
  onOpenEpicModal,
  gogInput,
  setGogInput,
  gogToken,
  setGogToken,
  showGogToken,
  setShowGogToken,
  isSyncingGOG,
  handleConnectAndSyncGOG,
}: ActiveTabPanelProps) {
  const steamAccount = accountProfile.accounts.steam;

  switch (activePlatformTab) {
    case "all":
      return (
        <OverviewPanel
          globalStats={globalStats}
          accountProfile={accountProfile}
          platformCounts={platformCounts}
          onSelectPlatform={onSelectTab}
          onEditPlatform={openEditPlatform}
          onDisconnectPlatform={handleDisconnectPlatform}
          onSelectGame={onSelectGame}
        />
      );

    case "steam":
      return (
        <PlatformSteamPanel
          steamAccount={steamAccount}
          displayName={displayName}
          platformCounts={platformCounts}
          steamInput={steamInput}
          setSteamInput={setSteamInput}
          steamApiKey={steamApiKey}
          setSteamApiKey={setSteamApiKey}
          showApiKeyInput={showApiKeyInput}
          setShowApiKeyInput={setShowApiKeyInput}
          isSyncingSteam={isSyncingSteam}
          syncProgressText={syncProgressText}
          onConnectAndSyncSteam={handleConnectAndSyncSteam}
          onBackToAll={() => onSelectTab("all")}
        />
      );

    case "xbox":
      return (
        <PlatformXboxPanel
          accountProfile={accountProfile}
          platformCounts={platformCounts}
          xboxInput={xboxInput}
          setXboxInput={setXboxInput}
          xboxApiKey={xboxApiKey}
          setXboxApiKey={setXboxApiKey}
          showXboxApiKey={showXboxApiKey}
          setShowXboxApiKey={setShowXboxApiKey}
          isSyncingXbox={isSyncingXbox}
          onConnectAndSyncXbox={handleConnectAndSyncXbox}
          openEditPlatform={openEditPlatform}
          handleDisconnectPlatform={handleDisconnectPlatform}
          onBackToAll={() => onSelectTab("all")}
        />
      );

    case "epic":
      return (
        <PlatformEpicPanel
          accountProfile={accountProfile}
          epicCounts={epicCounts}
          epicInput={epicInput}
          setEpicInput={setEpicInput}
          epicCode={epicCode}
          setEpicCode={setEpicCode}
          showEpicCode={showEpicCode}
          setShowEpicCode={setShowEpicCode}
          isSyncingEpic={isSyncingEpic}
          syncProgressText={syncProgressText}
          libAchievementFilter={libAchievementFilter}
          setLibAchievementFilter={setLibAchievementFilter}
          onConnectAndSyncEpic={handleConnectAndSyncEpic}
          onScanEpicAchievements={handleScanEpicAchievements}
          onCleanEpicGames={handleCleanEpicGames}
          openEditPlatform={openEditPlatform}
          handleDisconnectPlatform={handleDisconnectPlatform}
          onBackToAll={() => onSelectTab("all")}
          onOpenEpicModal={onOpenEpicModal}
        />
      );

    case "gog":
      return (
        <PlatformGogPanel
          accountProfile={accountProfile}
          platformCounts={platformCounts}
          gogInput={gogInput}
          setGogInput={setGogInput}
          gogToken={gogToken}
          setGogToken={setGogToken}
          showGogToken={showGogToken}
          setShowGogToken={setShowGogToken}
          isSyncingGOG={isSyncingGOG}
          onConnectAndSyncGOG={handleConnectAndSyncGOG}
          openEditPlatform={openEditPlatform}
          handleDisconnectPlatform={handleDisconnectPlatform}
          onBackToAll={() => onSelectTab("all")}
        />
      );

    case "duplicates":
      return (
        <DuplicatesPanel
          duplicateGroups={duplicateGroups}
          onSelectGame={onSelectGame}
          onBackToAll={() => onSelectTab("all")}
        />
      );

    case "collections":
      return (
        <CollectionsPanel
          collections={collections}
          selectedCollId={selectedCollId}
          setSelectedCollId={setSelectedCollId}
          isCreatingColl={isCreatingColl}
          setIsCreatingColl={setIsCreatingColl}
          newCollName={newCollName}
          setNewCollName={setNewCollName}
          newCollDesc={newCollDesc}
          setNewCollDesc={setNewCollDesc}
          handleCreateCollection={handleCreateCollection}
          handleDeleteCollection={handleDeleteCollection}
          onBackToAll={() => onSelectTab("all")}
        />
      );

    default:
      return null;
  }
}
