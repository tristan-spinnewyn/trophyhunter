// app/hooks/useHomePageController.ts

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUserData } from "@/context/UserDataContext";
import { isFeatureTab, parseLibraryTab, type LibraryTab } from "@/lib/library/library-filters";
import { calculateTrackingSummary } from "@/lib/library/library-tracking";
import type { GamePassCatalogItem } from "@/lib/gamepass/gamepass.types";
import { addGamePassItemToXboxLibrary } from "@/lib/gamepass/library-action.services";
import { useLibraryCollections } from "@/components/library/hooks/useLibraryCollections";
import { useCollectionStats } from "@/components/library/hooks/useCollectionStats";
import { useLibraryFilters } from "@/components/library/hooks/useLibraryFilters";
import { useAddGameFlow } from "@/components/library/hooks/useAddGameFlow";
import { useBulkImport } from "@/components/library/hooks/useBulkImport";
import { usePlatformSync } from "@/components/platform-sync/hooks/usePlatformSync";
import { usePlatformInputs } from "@/components/platform-sync/hooks/usePlatformInputs";

export function useHomePageController() {
  const {
    accountProfile, setAccountProfile, ownedGames, setOwnedGames, currentUser,
    setIsAuthOpen, steamApiKey, wishlistIds, setWishlistIds, collections, setCollections, setSteamUser,
  } = useUserData();

  const steamAccount = accountProfile.accounts.steam;
  const [bannerMsg, setBannerMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activePlatformTab, setActivePlatformTab] = useState<LibraryTab>(() =>
    parseLibraryTab(searchParams.get("tab"))
  );

  const platformInputs = usePlatformInputs({ accountProfile, initialSteamApiKey: steamApiKey });
  const collectionsState = useLibraryCollections({
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
    persistGames: platformSync.persistGames, setBannerMsg,
  });

  const bulkImport = useBulkImport({
    ownedGames, onOwnedGamesChange: setOwnedGames, syncSingleSteamGame: platformSync.syncSingleSteamGame,
    persistGames: platformSync.persistGames, setBannerMsg,
    steamUsername: steamAccount?.username, onCloseModal: () => addGameFlow.setIsAddGameOpen(false),
  });

  const stats = useCollectionStats(ownedGames);
  const libraryFilters = useLibraryFilters({
    ownedGames, activePlatformTab, wishlistIds, collections, selectedCollId: collectionsState.selectedCollId,
  });

  const trackingSummary = useMemo(() => calculateTrackingSummary(ownedGames), [ownedGames]);

  const handleSelectTab = (tab: LibraryTab) => {
    setActivePlatformTab(tab);
    libraryFilters.setLibPlatformFilter(isFeatureTab(tab) ? "all" : tab);
    // Keep the tab in the URL so a refresh or a shared link reopens the same view.
    router.replace(tab === "all" ? "/" : `/?tab=${tab}`, { scroll: false });
  };

  const handleAddGamePassToXbox = async (item: GamePassCatalogItem) => {
    await addGamePassItemToXboxLibrary({
      item,
      ownedGames,
      onOwnedGamesChange: setOwnedGames,
      persistGames: platformSync.persistGames,
      setBannerMsg,
    });
  };

  return {
    accountProfile, ownedGames, currentUser, setIsAuthOpen, steamAccount, bannerMsg, setBannerMsg,
    activePlatformTab, handleSelectTab, handleAddGamePassToXbox, platformInputs, collectionsState,
    platformSync, addGameFlow, bulkImport, stats, libraryFilters, trackingSummary,
  };
}
