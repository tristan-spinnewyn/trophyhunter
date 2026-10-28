// components/dashboard/hooks/useAccountDashboardController.ts
import { useState } from "react";
import type { DashboardTabType } from "@/components/dashboard/DashboardNavTabs";
import type { GamePassCatalogItem } from "@/lib/gamepass/gamepass.types";
import { addGamePassItemToXboxLibrary } from "@/components/dashboard/gamepass/gamepassLibraryAction.services";
import { usePlatformInputs } from "./usePlatformInputs";
import { useDashboardCollections } from "./useDashboardCollections";
import { usePlatformSync } from "./usePlatformSync";
import { useBulkImport } from "./useBulkImport";
import { useDashboardStats } from "./useDashboardStats";
import { useLibraryFilters } from "./useLibraryFilters";
import { useAddGameFlow } from "./useAddGameFlow";
import type {
  UserAccountProfile,
  OwnedGame,
  User as UserType,
} from "@/lib/types";
import type { CollectionWithGames } from "@/lib/types";

export interface AccountDashboardControllerParams {
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
  initialCollections?: CollectionWithGames[];
  onWishlistChange?: (wishlist: number[]) => void;
  onCollectionsChange?: (collections: CollectionWithGames[]) => void;
}


export function useAccountDashboardController(params: AccountDashboardControllerParams) {
  const {
    accountProfile, ownedGames, onAccountChange, onOwnedGamesChange,
    onSteamUserChange, currentUser, initialSteamApiKey = "",
    initialWishlist = [], initialCollections = [], onWishlistChange, onCollectionsChange,
  } = params;

  const steamAccount = accountProfile.accounts.steam;
  const [bannerMsg, setBannerMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activePlatformTab, setActivePlatformTab] = useState<DashboardTabType>("all");

  const platformInputs = usePlatformInputs({ accountProfile, initialSteamApiKey });
  const collectionsState = useDashboardCollections({
    currentUser, initialWishlist, initialCollections, onWishlistChange, onCollectionsChange, setBannerMsg,
  });

  const platformSync = usePlatformSync({
    accountProfile, ownedGames, onAccountChange, onOwnedGamesChange, onSteamUserChange, currentUser, setBannerMsg,
    steamInput: platformInputs.steamInput, setSteamInput: platformInputs.setSteamInput,
    steamApiKey: platformInputs.steamApiKey, xboxInput: platformInputs.xboxInput,
    xboxApiKey: platformInputs.xboxApiKey, epicInput: platformInputs.epicInput,
    epicCode: platformInputs.epicCode, setEpicCode: platformInputs.setEpicCode,
    gogInput: platformInputs.gogInput, gogToken: platformInputs.gogToken,
  });

  const addGameFlow = useAddGameFlow({
    ownedGames, onOwnedGamesChange, steamUsername: steamAccount?.username,
    syncSingleSteamGame: platformSync.syncSingleSteamGame,
    persistGamesToSQLite: platformSync.persistGamesToSQLite, setBannerMsg,
  });

  const bulkImport = useBulkImport({
    ownedGames, onOwnedGamesChange, syncSingleSteamGame: platformSync.syncSingleSteamGame,
    persistGamesToSQLite: platformSync.persistGamesToSQLite, setBannerMsg,
    steamUsername: steamAccount?.username, onCloseModal: () => addGameFlow.setIsAddGameOpen(false),
  });

  const stats = useDashboardStats(accountProfile, ownedGames);
  const libraryFilters = useLibraryFilters({
    ownedGames, activePlatformTab, wishlistIds: collectionsState.wishlistIds,
    collections: collectionsState.collections, selectedCollId: collectionsState.selectedCollId,
  });

  const handleSelectTab = (tab: DashboardTabType) => {
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
      onOwnedGamesChange,
      persistGamesToSQLite: platformSync.persistGamesToSQLite,
      setBannerMsg,
    });
  };

  const displayName = steamAccount?.displayName || steamAccount?.username || "Joueur Steam";

  return {
    bannerMsg, setBannerMsg, activePlatformTab, handleSelectTab, handleAddGamePassToXbox, displayName,
    steamAccount, platformInputs, collectionsState, platformSync, addGameFlow, bulkImport, stats, libraryFilters,
  };
}
