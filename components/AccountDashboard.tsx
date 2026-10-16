"use client";

import { useState } from "react";
import type {
  UserAccountProfile,
  OwnedGame,
  User as UserType,
} from "@/lib/types";
import type { LocalCollection } from "@/lib/storage";

// Panels & Components
import ActiveTabPanel from "@/components/dashboard/ActiveTabPanel";
import LibrarySection from "@/components/dashboard/LibrarySection";
import DashboardBanners from "@/components/dashboard/DashboardBanners";
import DashboardNavTabs, {
  type DashboardTabType,
} from "@/components/dashboard/DashboardNavTabs";

// Modals
import EditPlatformModal from "@/components/dashboard/EditPlatformModal";
import AddGameModal from "@/components/dashboard/AddGameModal";
import AddToCollectionModal from "@/components/dashboard/AddToCollectionModal";

// Custom Hooks
import { usePlatformInputs } from "@/components/dashboard/hooks/usePlatformInputs";
import { useDashboardCollections } from "@/components/dashboard/hooks/useDashboardCollections";
import { usePlatformSync } from "@/components/dashboard/hooks/usePlatformSync";
import { useBulkImport } from "@/components/dashboard/hooks/useBulkImport";
import { useDashboardStats } from "@/components/dashboard/hooks/useDashboardStats";
import { useLibraryFilters } from "@/components/dashboard/hooks/useLibraryFilters";
import { useAddGameFlow } from "@/components/dashboard/hooks/useAddGameFlow";

interface AccountDashboardProps {
  accountProfile: UserAccountProfile;
  ownedGames: OwnedGame[];
  onAccountChange: (profile: UserAccountProfile) => void;
  onOwnedGamesChange: (games: OwnedGame[]) => void;
  onSelectGame: (appId: number) => void;
  onSteamUserChange: (steamUser: string) => void;
  currentUser?: UserType | null;
  onOpenAuthModal?: () => void;
  initialSteamApiKey?: string;
  initialWishlist?: number[];
  initialCollections?: LocalCollection[];
  onWishlistChange?: (wishlist: number[]) => void;
  onCollectionsChange?: (collections: LocalCollection[]) => void;
}

export default function AccountDashboard({
  accountProfile,
  ownedGames,
  onAccountChange,
  onOwnedGamesChange,
  onSelectGame,
  onSteamUserChange,
  currentUser,
  onOpenAuthModal,
  initialSteamApiKey = "",
  initialWishlist = [],
  initialCollections = [],
  onWishlistChange,
  onCollectionsChange,
}: AccountDashboardProps) {
  const steamAccount = accountProfile.accounts.steam;

  // Status banner & Tab navigation
  const [bannerMsg, setBannerMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [activePlatformTab, setActivePlatformTab] =
    useState<DashboardTabType>("all");

  // Hook 1: Platform inputs (Steam, Xbox, Epic, GOG)
  const {
    steamInput,
    setSteamInput,
    steamApiKey,
    setSteamApiKey,
    showApiKeyInput,
    setShowApiKeyInput,
    xboxInput,
    setXboxInput,
    xboxApiKey,
    setXboxApiKey,
    showXboxApiKey,
    setShowXboxApiKey,
    epicInput,
    setEpicInput,
    epicCode,
    setEpicCode,
    showEpicCode,
    setShowEpicCode,
    gogInput,
    setGogInput,
    gogToken,
    setGogToken,
    showGogToken,
    setShowGogToken,
  } = usePlatformInputs({ accountProfile, initialSteamApiKey });

  // Hook 2: Collections and Wishlist
  const {
    wishlistIds,
    collections,
    selectedCollId,
    setSelectedCollId,
    newCollName,
    setNewCollName,
    newCollDesc,
    setNewCollDesc,
    isCreatingColl,
    setIsCreatingColl,
    gameToAddToColl,
    setGameToAddToColl,
    handleToggleWishlist,
    handleCreateCollection,
    handleDeleteCollection,
    handleAddGameToColl,
    handleRemoveGameFromColl,
  } = useDashboardCollections({
    currentUser,
    initialWishlist,
    initialCollections,
    onWishlistChange,
    onCollectionsChange,
    setBannerMsg,
  });

  // Hook 3: Platform Sync & Persistence
  const {
    isSyncingSteam,
    isSyncingXbox,
    isSyncingEpic,
    isSyncingGOG,
    syncProgressText,
    editingPlatform,
    setEditingPlatform,
    platForm,
    setPlatForm,
    syncSingleSteamGame,
    persistGamesToSQLite,
    handleConnectAndSyncSteam,
    handleConnectAndSyncXbox,
    handleConnectAndSyncEpic,
    handleConnectAndSyncGOG,
    openEditPlatform,
    handleSavePlatformModal,
    handleDisconnectPlatform,
    handleSyncGame,
    handleRemoveGame,
    handleScanEpicAchievements,
    handleCleanEpicGames,
  } = usePlatformSync({
    accountProfile,
    ownedGames,
    onAccountChange,
    onOwnedGamesChange,
    onSteamUserChange,
    currentUser,
    setBannerMsg,
    steamInput,
    setSteamInput,
    steamApiKey,
    xboxInput,
    xboxApiKey,
    epicInput,
    epicCode,
    setEpicCode,
    gogInput,
    gogToken,
  });

  // Hook 4: Add Game Flow
  const {
    isAddGameOpen,
    setIsAddGameOpen,
    addGameQuery,
    addGameResults,
    isSearchingAdd,
    selectedPlatformForAdd,
    setSelectedPlatformForAdd,
    handleSearchAddGame,
    handleAddGameToLibrary,
  } = useAddGameFlow({
    ownedGames,
    onOwnedGamesChange,
    steamUsername: steamAccount?.username,
    syncSingleSteamGame,
    persistGamesToSQLite,
    setBannerMsg,
  });

  // Hook 5: Bulk Import
  const {
    bulkImportText,
    setBulkImportText,
    isBulkImporting,
    handleBulkImport,
  } = useBulkImport({
    ownedGames,
    onOwnedGamesChange,
    syncSingleSteamGame,
    persistGamesToSQLite,
    setBannerMsg,
    steamUsername: steamAccount?.username,
    onCloseModal: () => setIsAddGameOpen(false),
  });

  // Hook 6: Duplicate Groups & Statistics
  const {
    duplicateGroups,
    globalStats,
    platformCounts,
    epicCounts,
  } = useDashboardStats(accountProfile, ownedGames);

  // Hook 7: Library Filters & Sorting
  const {
    libPlatformFilter,
    setLibPlatformFilter,
    libStatusFilter,
    setLibStatusFilter,
    libAchievementFilter,
    setLibAchievementFilter,
    libSortOrder,
    setLibSortOrder,
    libSearch,
    setLibSearch,
    filteredGames,
  } = useLibraryFilters({
    ownedGames,
    activePlatformTab,
    wishlistIds,
    collections,
    selectedCollId,
  });

  const handleSelectTab = (tab: DashboardTabType) => {
    setActivePlatformTab(tab);
    if (
      tab === "all" ||
      tab === "duplicates" ||
      tab === "wishlist" ||
      tab === "collections"
    ) {
      setLibPlatformFilter("all");
    } else {
      setLibPlatformFilter(tab);
    }
  };

  const displayName =
    steamAccount?.displayName || steamAccount?.username || "Joueur Steam";

  return (
    <div className="space-y-6">
      {/* Status & Sync Progress Banners */}
      <DashboardBanners
        bannerMsg={bannerMsg}
        onDismissBanner={() => setBannerMsg(null)}
        syncProgressText={syncProgressText}
      />

      {/* Top Platform Navigation Tabs */}
      <DashboardNavTabs
        activePlatformTab={activePlatformTab}
        onSelectTab={handleSelectTab}
        ownedGamesCount={ownedGames.length}
        platformCounts={platformCounts}
        accountProfile={accountProfile}
        duplicateCount={duplicateGroups.length}
        wishlistCount={wishlistIds.length}
        collectionsCount={collections.length}
        currentUser={currentUser}
        onOpenAuthModal={onOpenAuthModal}
      />

      {/* Active Tab Platform View */}
      <ActiveTabPanel
        activePlatformTab={activePlatformTab}
        globalStats={globalStats}
        accountProfile={accountProfile}
        platformCounts={platformCounts}
        duplicateGroups={duplicateGroups}
        epicCounts={epicCounts}
        libAchievementFilter={libAchievementFilter}
        setLibAchievementFilter={setLibAchievementFilter}
        onSelectTab={handleSelectTab}
        openEditPlatform={openEditPlatform}
        handleDisconnectPlatform={handleDisconnectPlatform}
        onSelectGame={onSelectGame}
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
        displayName={displayName}
        steamInput={steamInput}
        setSteamInput={setSteamInput}
        steamApiKey={steamApiKey}
        setSteamApiKey={setSteamApiKey}
        showApiKeyInput={showApiKeyInput}
        setShowApiKeyInput={setShowApiKeyInput}
        isSyncingSteam={isSyncingSteam}
        syncProgressText={syncProgressText}
        handleConnectAndSyncSteam={handleConnectAndSyncSteam}
        xboxInput={xboxInput}
        setXboxInput={setXboxInput}
        xboxApiKey={xboxApiKey}
        setXboxApiKey={setXboxApiKey}
        showXboxApiKey={showXboxApiKey}
        setShowXboxApiKey={setShowXboxApiKey}
        isSyncingXbox={isSyncingXbox}
        handleConnectAndSyncXbox={handleConnectAndSyncXbox}
        epicInput={epicInput}
        setEpicInput={setEpicInput}
        epicCode={epicCode}
        setEpicCode={setEpicCode}
        showEpicCode={showEpicCode}
        setShowEpicCode={setShowEpicCode}
        isSyncingEpic={isSyncingEpic}
        handleConnectAndSyncEpic={handleConnectAndSyncEpic}
        handleScanEpicAchievements={handleScanEpicAchievements}
        handleCleanEpicGames={() =>
          handleCleanEpicGames(epicCounts.noAch, epicCounts.withAch)
        }
        gogInput={gogInput}
        setGogInput={setGogInput}
        gogToken={gogToken}
        setGogToken={setGogToken}
        showGogToken={showGogToken}
        setShowGogToken={setShowGogToken}
        isSyncingGOG={isSyncingGOG}
        handleConnectAndSyncGOG={handleConnectAndSyncGOG}
      />

      {/* Owned Games Library Section */}
      <LibrarySection
        activePlatformTab={activePlatformTab}
        filteredGames={filteredGames}
        totalOwnedGamesCount={ownedGames.length}
        platformGameCount={platformCounts[activePlatformTab] || 0}
        steamAccount={steamAccount}
        onOpenAddGame={() => setIsAddGameOpen(true)}
        onAddApiKeyClick={() => {
          setShowApiKeyInput(true);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        libSearch={libSearch}
        setLibSearch={setLibSearch}
        libPlatformFilter={libPlatformFilter}
        setLibPlatformFilter={setLibPlatformFilter}
        libStatusFilter={libStatusFilter}
        setLibStatusFilter={setLibStatusFilter}
        libAchievementFilter={libAchievementFilter}
        setLibAchievementFilter={setLibAchievementFilter}
        libSortOrder={libSortOrder}
        setLibSortOrder={setLibSortOrder}
        selectedCollId={selectedCollId}
        wishlistIds={wishlistIds}
        collections={collections}
        onSelectGame={onSelectGame}
        onToggleWishlist={handleToggleWishlist}
        onOpenAddToCollection={setGameToAddToColl}
        onRemoveFromCollection={handleRemoveGameFromColl}
        onSyncGame={handleSyncGame}
        onRemoveGame={handleRemoveGame}
        onConnectAndSyncSteam={handleConnectAndSyncSteam}
        isSyncingSteam={isSyncingSteam}
      />

      {/* Modal: Edit/Add Platform Account & Stats */}
      <EditPlatformModal
        editingPlatform={editingPlatform}
        onClose={() => setEditingPlatform(null)}
        platForm={platForm}
        setPlatForm={setPlatForm}
        onSave={handleSavePlatformModal}
      />

      {/* Modal: Add Game to Owned Library or Bulk Import */}
      <AddGameModal
        isOpen={isAddGameOpen}
        onClose={() => setIsAddGameOpen(false)}
        selectedPlatformForAdd={selectedPlatformForAdd}
        setSelectedPlatformForAdd={setSelectedPlatformForAdd}
        addGameQuery={addGameQuery}
        handleSearchAddGame={handleSearchAddGame}
        isSearchingAdd={isSearchingAdd}
        addGameResults={addGameResults}
        ownedGames={ownedGames}
        handleAddGameToLibrary={handleAddGameToLibrary}
        bulkImportText={bulkImportText}
        setBulkImportText={setBulkImportText}
        handleBulkImport={handleBulkImport}
        isBulkImporting={isBulkImporting}
      />

      {/* Modal: Add Game to Collection */}
      <AddToCollectionModal
        game={gameToAddToColl}
        collections={collections}
        onClose={() => setGameToAddToColl(null)}
        onAddToCollection={handleAddGameToColl}
      />
    </div>
  );
}
