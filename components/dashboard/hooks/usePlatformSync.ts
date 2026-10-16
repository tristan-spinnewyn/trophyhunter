"use client";

import { useState } from "react";
import type {
  PlatformType,
  OwnedGame,
  UserAccountProfile,
  User as UserType,
} from "@/lib/types";
import { mergeGamesList } from "@/components/dashboard/utils";
import { usePlatformDb } from "./usePlatformDb";
import { useSteamSync } from "./useSteamSync";
import { useXboxSync } from "./useXboxSync";
import { useEpicSync } from "./useEpicSync";
import { useGogSync } from "./useGogSync";
import { usePlatformModal } from "./usePlatformModal";

interface UsePlatformSyncProps {
  accountProfile: UserAccountProfile;
  ownedGames: OwnedGame[];
  onAccountChange: (profile: UserAccountProfile) => void;
  onOwnedGamesChange: (games: OwnedGame[]) => void;
  onSteamUserChange: (steamUser: string) => void;
  currentUser?: UserType | null;
  setBannerMsg: (
    msg: { type: "success" | "error"; text: string } | null
  ) => void;
  steamInput: string;
  setSteamInput: (val: string) => void;
  steamApiKey: string;
  xboxInput: string;
  xboxApiKey: string;
  epicInput: string;
  epicCode: string;
  setEpicCode: (val: string) => void;
  gogInput: string;
  gogToken: string;
}

export function usePlatformSync({
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
}: UsePlatformSyncProps) {
  const [syncProgressText, setSyncProgressText] = useState<string | null>(null);

  // Dedicated Epic Auth Modal state for library syncing
  const [isEpicAuthModalOpen, setIsEpicAuthModalOpen] = useState(false);
  const [epicAuthModalGame, setEpicAuthModalGame] = useState<OwnedGame | null>(null);
  const [epicAuthModalError, setEpicAuthModalError] = useState<string | null>(null);
  const [isEpicModalSyncing, setIsEpicModalSyncing] = useState(false);

  const {
    updateAccountProfileInMemory,
    persistAccountToSQLite,
    persistGamesToSQLite,
    removeAccountFromSQLite,
    removeGameFromSQLite,
  } = usePlatformDb({ accountProfile, onAccountChange });

  const {
    isSyncingSteam,
    syncSingleSteamGame,
    handleConnectAndSyncSteam,
  } = useSteamSync({
    ownedGames,
    onOwnedGamesChange,
    onSteamUserChange,
    currentUser,
    setBannerMsg,
    setSyncProgressText,
    steamInput,
    steamApiKey,
    updateAccountProfileInMemory,
    persistAccountToSQLite,
    persistGamesToSQLite,
  });

  const { isSyncingXbox, handleConnectAndSyncXbox } = useXboxSync({
    ownedGames,
    onOwnedGamesChange,
    setBannerMsg,
    xboxInput,
    xboxApiKey,
    updateAccountProfileInMemory,
    persistAccountToSQLite,
    persistGamesToSQLite,
  });

  const {
    isSyncingEpic,
    enrichEpicGamesAchievements,
    handleConnectAndSyncEpic,
    handleScanEpicAchievements,
    handleCleanEpicGames,
  } = useEpicSync({
    ownedGames,
    onOwnedGamesChange,
    setBannerMsg,
    setSyncProgressText,
    epicInput,
    epicCode,
    setEpicCode,
    updateAccountProfileInMemory,
    persistAccountToSQLite,
    persistGamesToSQLite,
  });

  const { isSyncingGOG, handleConnectAndSyncGOG } = useGogSync({
    ownedGames,
    onOwnedGamesChange,
    setBannerMsg,
    gogInput,
    gogToken,
    updateAccountProfileInMemory,
    persistAccountToSQLite,
    persistGamesToSQLite,
  });

  const {
    editingPlatform,
    setEditingPlatform,
    platForm,
    setPlatForm,
    openEditPlatform,
    handleSavePlatformModal,
    handleDisconnectPlatform,
  } = usePlatformModal({
    accountProfile,
    onAccountChange,
    onSteamUserChange,
    setSteamInput,
    setBannerMsg,
    updateAccountProfileInMemory,
    persistAccountToSQLite,
    removeAccountFromSQLite,
    handleConnectAndSyncSteam,
  });

  const handleRemoveGame = async (appId: number, platform: PlatformType) => {
    const next = ownedGames.filter(
      (item) => !(item.appId === appId && item.platform === platform)
    );
    onOwnedGamesChange(next);
    await removeGameFromSQLite(appId, platform);
  };

  const syncEpicGameWithData = async (g: OwnedGame, data: any) => {
    const updatedGame: OwnedGame = {
      ...g,
      unlockedCount: data.count ?? data.unlockedCount ?? g.unlockedCount,
      totalAchievements: data.totalAchievements ?? g.totalAchievements,
    };
    const next = mergeGamesList(ownedGames, [updatedGame]);
    onOwnedGamesChange(next);
    await persistGamesToSQLite([updatedGame]);
    setBannerMsg({
      type: "success",
      text: `Succès Epic de "${g.name}" synchronisés (${updatedGame.unlockedCount}/${updatedGame.totalAchievements}) !`,
    });
  };

  const handleSyncGame = async (g: OwnedGame) => {
    const steamAccount = accountProfile.accounts.steam;
    if (g.platform === "steam" && steamAccount?.username) {
      const synced = await syncSingleSteamGame(steamAccount.username, g);
      const next = mergeGamesList(ownedGames, [synced]);
      onOwnedGamesChange(next);
      await persistGamesToSQLite([synced]);
      setBannerMsg({
        type: "success",
        text: `Succès de "${synced.name}" synchronisés (${synced.unlockedCount}/${synced.totalAchievements}) !`,
      });
    } else if (g.platform === "epic") {
      try {
        const res = await fetch(
          `/api/sync?platform=epic&appId=${g.appId}&name=${encodeURIComponent(
            g.name
          )}`
        );
        const data = res.ok ? await res.json() : null;

        if (data?.requiresToken) {
          setEpicAuthModalGame(g);
          setEpicAuthModalError(data.error || null);
          setIsEpicAuthModalOpen(true);
          return;
        }

        if (data && data.success) {
          await syncEpicGameWithData(g, data);
          return;
        }
      } catch (e) {
        console.warn("Epic single sync error, falling back:", e);
      }
      const next = await enrichEpicGamesAchievements(
        [{ ...g, totalAchievements: 0 }],
        ownedGames
      );
      const updatedGame = next.find(
        (item) => item.appId === g.appId && item.platform === "epic"
      );
      setBannerMsg({
        type: "success",
        text: `Succès de "${g.name}" actualisés (${updatedGame?.totalAchievements || 0} succès détectés) !`,
      });
    }
  };

  const handleEpicModalSubmit = async (token: string) => {
    if (!epicAuthModalGame) return;
    setIsEpicModalSyncing(true);
    setEpicAuthModalError(null);
    try {
      const res = await fetch(
        `/api/sync?platform=epic&appId=${epicAuthModalGame.appId}&name=${encodeURIComponent(
          epicAuthModalGame.name
        )}&authorizationToken=${encodeURIComponent(token)}`
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Code d'autorisation Epic Games invalide.");
      }
      await syncEpicGameWithData(epicAuthModalGame, data);
      setIsEpicAuthModalOpen(false);
      setEpicAuthModalGame(null);
    } catch (err: any) {
      setEpicAuthModalError(err.message || "Erreur de validation du code Epic.");
    } finally {
      setIsEpicModalSyncing(false);
    }
  };

  return {
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
    enrichEpicGamesAchievements,
    persistGamesToSQLite,
    removeGameFromSQLite,
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
    // Epic Auth Modal
    isEpicAuthModalOpen,
    epicAuthModalGame,
    epicAuthModalError,
    isEpicModalSyncing,
    closeEpicAuthModal: () => {
      setIsEpicAuthModalOpen(false);
      setEpicAuthModalGame(null);
      setEpicAuthModalError(null);
    },
    handleEpicModalSubmit,
  };
}
