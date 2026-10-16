"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Gamepad2,
  Flame,
  User,
  ShieldCheck,
  Plus,
  RefreshCw,
} from "lucide-react";
import { useUserData } from "@/context/UserDataContext";
import DashboardBanners from "@/components/dashboard/DashboardBanners";
import DashboardNavTabs, {
  type DashboardTabType,
} from "@/components/dashboard/DashboardNavTabs";
import LibrarySection from "@/components/dashboard/LibrarySection";
import AddGameModal from "@/components/dashboard/AddGameModal";
import AddToCollectionModal from "@/components/dashboard/AddToCollectionModal";

// Custom Hooks
import { useDashboardCollections } from "@/components/dashboard/hooks/useDashboardCollections";
import { useDashboardStats } from "@/components/dashboard/hooks/useDashboardStats";
import { useLibraryFilters } from "@/components/dashboard/hooks/useLibraryFilters";
import { useAddGameFlow } from "@/components/dashboard/hooks/useAddGameFlow";
import { useBulkImport } from "@/components/dashboard/hooks/useBulkImport";
import { usePlatformSync } from "@/components/dashboard/hooks/usePlatformSync";
import { usePlatformInputs } from "@/components/dashboard/hooks/usePlatformInputs";

const FEATURED_GAMES = [
  {
    id: 1091500,
    name: "Cyberpunk 2077",
    img: "https://cdn.akamai.steamstatic.com/steam/apps/1091500/header.jpg",
    count: "45 succès",
  },
  {
    id: 1245620,
    name: "ELDEN RING",
    img: "https://cdn.akamai.steamstatic.com/steam/apps/1245620/header.jpg",
    count: "42 succès",
  },
  {
    id: 367520,
    name: "Hollow Knight",
    img: "https://cdn.akamai.steamstatic.com/steam/apps/367520/header.jpg",
    count: "63 succès",
  },
  {
    id: 292030,
    name: "The Witcher 3",
    img: "https://cdn.akamai.steamstatic.com/steam/apps/292030/header.jpg",
    count: "78 succès",
  },
  {
    id: 1086940,
    name: "Baldur's Gate 3",
    img: "https://cdn.akamai.steamstatic.com/steam/apps/1086940/header.jpg",
    count: "53 succès",
  },
  {
    id: 2050650,
    name: "Resident Evil 4",
    img: "https://cdn.akamai.steamstatic.com/steam/apps/2050650/header.jpg",
    count: "39 succès",
  },
  {
    id: 504230,
    name: "Celeste",
    img: "https://cdn.akamai.steamstatic.com/steam/apps/504230/header.jpg",
    count: "32 succès",
  },
  {
    id: 105600,
    name: "Terraria",
    img: "https://cdn.akamai.steamstatic.com/steam/apps/105600/header.jpg",
    count: "115 succès",
  },
];

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
    setShowApiKeyInput,
  } = usePlatformInputs({ accountProfile, initialSteamApiKey: steamApiKey });

  // Collections & Wishlist
  const {
    selectedCollId,
    gameToAddToColl,
    setGameToAddToColl,
    handleToggleWishlist,
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
  const { duplicateGroups, platformCounts } = useDashboardStats(
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
      {/* Top Banner: Direct access to Accounts / Platforms */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 p-4 sm:p-5 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-400 shrink-0">
            <Gamepad2 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Ma Bibliothèque Multi-Plateforme
            </h2>
            <p className="text-xs text-slate-400">
              {ownedGames.length} jeux suivis • Steam, Xbox, Epic Games & GOG
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/account"
            className="flex items-center gap-1.5 rounded-xl border border-purple-500/40 bg-purple-500/10 px-3.5 py-2 text-xs font-bold text-purple-300 hover:bg-purple-500/20 transition shadow-sm"
          >
            <User className="h-3.5 w-3.5 text-purple-400" />
            <span>Gérer mes comptes & plateformes</span>
          </Link>
          <button
            onClick={() => setIsAddGameOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-sky-500 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-md shadow-sky-500/20 hover:bg-sky-400 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Ajouter un jeu</span>
          </button>
        </div>
      </div>

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
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Flame className="h-4 w-4 text-amber-400" />
            Jeux populaires à explorer
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {FEATURED_GAMES.map((item) => (
            <button
              key={item.id}
              onClick={() => router.push(`/game/${item.id}`)}
              className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 text-left transition hover:border-sky-500/60 hover:shadow-xl hover:shadow-sky-500/10"
            >
              <div className="h-28 w-full overflow-hidden bg-slate-950">
                <img
                  src={item.img}
                  alt={item.name}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-2.5">
                <div className="truncate text-xs font-bold text-white group-hover:text-sky-400">
                  {item.name}
                </div>
                <div className="text-[11px] text-slate-400">{item.count}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Add / Import Modal */}
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

      {/* Add To Collection Modal */}
      <AddToCollectionModal
        game={gameToAddToColl}
        collections={collections}
        onClose={() => setGameToAddToColl(null)}
        onAddToCollection={handleAddGameToColl}
      />
    </div>
  );
}
