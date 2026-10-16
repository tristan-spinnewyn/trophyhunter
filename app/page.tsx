"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUserData } from "@/context/UserDataContext";
import DashboardBanners from "@/components/dashboard/DashboardBanners";
import DashboardNavTabs, {
  type DashboardTabType,
} from "@/components/dashboard/DashboardNavTabs";
import LibrarySection from "@/components/dashboard/LibrarySection";
import CollectionsPanel from "@/components/dashboard/CollectionsPanel";
import DuplicatesPanel from "@/components/dashboard/DuplicatesPanel";
import DashboardModals from "@/components/dashboard/DashboardModals";
import { LibraryHeaderBanner } from "@/components/library/LibraryHeaderBanner";
import { FeaturedGamesSection } from "@/components/library/FeaturedGamesSection";

// Custom Hooks
import { useDashboardCollections } from "@/components/dashboard/hooks/useDashboardCollections";
import { useDashboardStats } from "@/components/dashboard/hooks/useDashboardStats";
import { useLibraryFilters } from "@/components/dashboard/hooks/useLibraryFilters";
import { useAddGameFlow } from "@/components/dashboard/hooks/useAddGameFlow";
import { useBulkImport } from "@/components/dashboard/hooks/useBulkImport";
import { usePlatformSync } from "@/components/dashboard/hooks/usePlatformSync";
import { usePlatformInputs } from "@/components/dashboard/hooks/usePlatformInputs";

export default function HomePage() {
  const router = useRouter();
  const {
    accountProfile,
    setAccountProfile,
    ownedGames,
    setOwnedGames,
    currentUser,
    setIsAuthOpen,
    steamApiKey,
    wishlistIds,
    setWishlistIds,
    collections,
    setCollections,
    setSteamUser,
  } = useUserData();

  const steamAccount = accountProfile.accounts.steam;

  // Status banner & Tab navigation
  const [bannerMsg, setBannerMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [activePlatformTab, setActivePlatformTab] =
    useState<DashboardTabType>("all");

  // Platform inputs
  const {
    steamInput,
    setSteamInput,
    xboxInput,
    xboxApiKey,
    epicInput,
    epicCode,
    setEpicCode,
    gogInput,
    gogToken,
  } = usePlatformInputs({ accountProfile, initialSteamApiKey: steamApiKey });

  // Collections & Wishlist
  const {
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
    initialWishlist: wishlistIds,
    initialCollections: collections,
    onWishlistChange: setWishlistIds,
    onCollectionsChange: setCollections,
    setBannerMsg,
  });

  // Platform Sync & Persistence
  const {
    isSyncingSteam,
    syncProgressText,
    syncSingleSteamGame,
    persistGamesToSQLite,
    handleConnectAndSyncSteam,
    handleSyncGame,
    handleRemoveGame,
  } = usePlatformSync({
    accountProfile,
    ownedGames,
    onAccountChange: setAccountProfile,
    onOwnedGamesChange: setOwnedGames,
    onSteamUserChange: setSteamUser,
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

  // Add Game Flow
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
    onOwnedGamesChange: setOwnedGames,
    steamUsername: steamAccount?.username,
    syncSingleSteamGame,
    persistGamesToSQLite,
    setBannerMsg,
  });

  // Bulk Import
  const {
    bulkImportText,
    setBulkImportText,
    isBulkImporting,
    handleBulkImport,
  } = useBulkImport({
    ownedGames,
    onOwnedGamesChange: setOwnedGames,
    syncSingleSteamGame,
    persistGamesToSQLite,
    setBannerMsg,
    steamUsername: steamAccount?.username,
    onCloseModal: () => setIsAddGameOpen(false),
  });

  // Statistics & Duplicate Groups
  const { duplicateGroups, globalStats, platformCounts } = useDashboardStats(
    accountProfile,
    ownedGames
  );

  // Filters & Sorting
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

  return (
    <div className="space-y-6">
      {/* Top Banner: Direct access to Accounts / Platforms + KPI Strip */}
      <LibraryHeaderBanner
        ownedGamesCount={ownedGames.length}
        onOpenAddGame={() => setIsAddGameOpen(true)}
        globalStats={globalStats}
      />

      {/* Status & Sync Progress Banners */}
      <DashboardBanners
        bannerMsg={bannerMsg}
        onDismissBanner={() => setBannerMsg(null)}
        syncProgressText={syncProgressText}
      />

      {/* Platform & Filter Tabs */}
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
        onOpenAuthModal={() => setIsAuthOpen(true)}
      />

      {/* Contextual Panels for Collections & Duplicates */}
      {activePlatformTab === "collections" && (
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
          onBackToAll={() => handleSelectTab("all")}
        />
      )}

      {activePlatformTab === "duplicates" && (
        <DuplicatesPanel
          duplicateGroups={duplicateGroups}
          onSelectGame={(appId) => router.push(`/game/${appId}`)}
          onBackToAll={() => handleSelectTab("all")}
        />
      )}

      {/* Owned Games Section */}
      <LibrarySection
        activePlatformTab={activePlatformTab}
        filteredGames={filteredGames}
        totalOwnedGamesCount={ownedGames.length}
        platformGameCount={platformCounts[activePlatformTab] || 0}
        steamAccount={steamAccount}
        onOpenAddGame={() => setIsAddGameOpen(true)}
        onAddApiKeyClick={() => router.push("/account")}
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
        onSelectGame={(appId) => router.push(`/game/${appId}`)}
        onToggleWishlist={handleToggleWishlist}
        onOpenAddToCollection={setGameToAddToColl}
        onRemoveFromCollection={handleRemoveGameFromColl}
        onSyncGame={handleSyncGame}
        onRemoveGame={handleRemoveGame}
        onConnectAndSyncSteam={handleConnectAndSyncSteam}
        isSyncingSteam={isSyncingSteam}
      />

      {/* Popular Games to Explore */}
      <FeaturedGamesSection ownedGames={ownedGames} />

      {/* Modals */}
      <DashboardModals
        isAddGameOpen={isAddGameOpen}
        onCloseAddGame={() => setIsAddGameOpen(false)}
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
        gameToAddToColl={gameToAddToColl}
        collections={collections}
        onCloseAddToColl={() => setGameToAddToColl(null)}
        onAddToCollection={handleAddGameToColl}
      />
    </div>
  );
}
