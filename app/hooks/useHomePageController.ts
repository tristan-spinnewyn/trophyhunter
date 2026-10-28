// app/hooks/useHomePageController.ts

import { useState } from "react";
import { useUserData } from "@/context/UserDataContext";
import type { LibraryTab } from "@/lib/library/library-filters";
import type { GamePassCatalogItem } from "@/lib/gamepass/gamepass.types";
import { addGamePassItemToXboxLibrary } from "@/components/dashboard/gamepass/gamepassLibraryAction.services";
import { useDashboardCollections } from "@/components/dashboard/hooks/useDashboardCollections";
import { useDashboardStats } from "@/components/dashboard/hooks/useDashboardStats";
import { useLibraryFilters } from "@/components/dashboard/hooks/useLibraryFilters";
import { useAddGameFlow } from "@/components/dashboard/hooks/useAddGameFlow";
import { useBulkImport } from "@/components/dashboard/hooks/useBulkImport";
import { usePlatformSync } from "@/components/dashboard/hooks/usePlatformSync";
import { usePlatformInputs } from "@/components/dashboard/hooks/usePlatformInputs";

export function useHomePageController() {
  const {
    accountProfile, setAccountProfile, ownedGames, setOwnedGames, currentUser,
    setIsAuthOpen, steamApiKey, wishlistIds, setWishlistIds, collections, setCollections, setSteamUser,
  } = useUserData();

  const steamAccount = accountProfile.accounts.steam;
  const [bannerMsg, setBannerMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activePlatformTab, setActivePlatformTab] = useState<LibraryTab>("all");

  const platformInputs = usePlatformInputs({ accountProfile, initialSteamApiKey: steamApiKey });
  const collectionsState = useDashboardCollections({
    currentUser, initialWishlist: wishlistIds, initialCollections: collections,
    onWishlistChange: setWishlistIds, onCollectionsChange: setCollections, setBannerMsg,
  });

  const platformSync = usePlatformSync({
    accountProfile, ownedGames, onAccountChange: setAccountProfile, onOwnedGamesChange: setOwnedGames,
    onSteamUserChange: setSteamUser, currentUser, setBannerMsg,
    steamInput: platformInputs.steamInput, setSteamInput: platformInputs.setSteamInput,
    steamApiKey, xboxInput: platformInputs.xboxInput, xboxApiKey: platformInputs.xboxApiKey,
    epicInput: platformInputs.epicInput, epicCode: platformInputs.epicCode, setEpicCode: platformInputs.setEpicCode,
    gogInput: platformInputs.gogInput, gogToken: platformInputs.gogToken,
  });

  const addGameFlow = useAddGameFlow({
    ownedGames, onOwnedGamesChange: setOwnedGames, steamUsername: steamAccount?.username,
    syncSingleSteamGame: platformSync.syncSingleSteamGame,
    persistGamesToSQLite: platformSync.persistGamesToSQLite, setBannerMsg,
  });

  const bulkImport = useBulkImport({
    ownedGames, onOwnedGamesChange: setOwnedGames, syncSingleSteamGame: platformSync.syncSingleSteamGame,
    persistGamesToSQLite: platformSync.persistGamesToSQLite, setBannerMsg,
    steamUsername: steamAccount?.username, onCloseModal: () => addGameFlow.setIsAddGameOpen(false),
  });

  const stats = useDashboardStats(accountProfile, ownedGames);
  const libraryFilters = useLibraryFilters({
    ownedGames, activePlatformTab, wishlistIds, collections, selectedCollId: collectionsState.selectedCollId,
  });

  const handleSelectTab = (tab: LibraryTab) => {
    setActivePlatformTab(tab);
    libraryFilters.setLibPlatformFilter(
      tab === "all" || tab === "duplicates" || tab === "wishlist" || tab === "collections" || tab === "gamepass"
        ? "all"
        : tab
    );
  };

  const handleAddGamePassToXbox = async (item: GamePassCatalogItem) => {
    await addGamePassItemToXboxLibrary({
      item,
      ownedGames,
      onOwnedGamesChange: setOwnedGames,
      persistGamesToSQLite: platformSync.persistGamesToSQLite,
      setBannerMsg,
    });
  };

  return {
    accountProfile, ownedGames, currentUser, setIsAuthOpen, steamAccount, bannerMsg, setBannerMsg,
    activePlatformTab, handleSelectTab, handleAddGamePassToXbox, platformInputs, collectionsState,
    platformSync, addGameFlow, bulkImport, stats, libraryFilters,
  };
}
