// components/dashboard/hooks/usePlatformSync.ts
"use client";
import { useState } from "react";
import { usePlatformDb } from "./usePlatformDb";
import { useSteamSync } from "./useSteamSync";
import { useXboxSync } from "./useXboxSync";
import { useEpicSync } from "./useEpicSync";
import { useGogSync } from "./useGogSync";
import { usePlatformModal } from "./usePlatformModal";
import { useEpicAuthModalState } from "./useEpicAuthModalState";
import { useGameSyncHandler } from "./useGameSyncHandler";
import { useGameStatusHandler } from "./useGameStatusHandler";
import type {
  OwnedGame,
  UserAccountProfile,
  User as UserType,
} from "@/lib/types";

export interface UsePlatformSyncProps {
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

export function usePlatformSync(props: UsePlatformSyncProps) {
  const { accountProfile, ownedGames, onAccountChange, onOwnedGamesChange, onSteamUserChange,
    currentUser, setBannerMsg, steamInput, setSteamInput, steamApiKey, xboxInput, xboxApiKey,
    epicInput, epicCode, setEpicCode, gogInput, gogToken } = props;

  const [syncProgressText, setSyncProgressText] = useState<string | null>(null);

  const db = usePlatformDb({ accountProfile, onAccountChange });
  const statusHandler = useGameStatusHandler({ ownedGames, onOwnedGamesChange });

  const steam = useSteamSync({
    ownedGames, onOwnedGamesChange, onSteamUserChange, currentUser,
    setBannerMsg, setSyncProgressText, steamInput, steamApiKey,
    updateAccountProfileInMemory: db.updateAccountProfileInMemory,
    persistAccountToSQLite: db.persistAccountToSQLite,
    persistGamesToSQLite: db.persistGamesToSQLite,
  });

  const xbox = useXboxSync({
    ownedGames, onOwnedGamesChange, setBannerMsg, xboxInput, xboxApiKey,
    updateAccountProfileInMemory: db.updateAccountProfileInMemory,
    persistAccountToSQLite: db.persistAccountToSQLite,
    persistGamesToSQLite: db.persistGamesToSQLite,
  });

  const gog = useGogSync({
    ownedGames, onOwnedGamesChange, setBannerMsg, gogInput, gogToken,
    updateAccountProfileInMemory: db.updateAccountProfileInMemory,
    persistAccountToSQLite: db.persistAccountToSQLite,
    persistGamesToSQLite: db.persistGamesToSQLite,
  });

  const epicModal = useEpicAuthModalState({
    handleConnectAndSyncEpic: (u, c) => epic.handleConnectAndSyncEpic(u, c),
    syncEpicGameWithData: (g, d) => gameHandler.syncEpicGameWithData(g, d),
  });

  const epic = useEpicSync({
    ownedGames, onOwnedGamesChange, setBannerMsg, setSyncProgressText,
    epicInput, epicCode, setEpicCode,
    updateAccountProfileInMemory: db.updateAccountProfileInMemory,
    persistAccountToSQLite: db.persistAccountToSQLite,
    persistGamesToSQLite: db.persistGamesToSQLite,
    onRequireToken: epicModal.openEpicAuthModalForLibrary,
  });

  const gameHandler = useGameSyncHandler({
    accountProfile, ownedGames, onOwnedGamesChange,
    removeGameFromSQLite: db.removeGameFromSQLite,
    persistGamesToSQLite: db.persistGamesToSQLite,
    setBannerMsg, syncSingleSteamGame: steam.syncSingleSteamGame,
    enrichEpicGamesAchievements: epic.enrichEpicGamesAchievements,
    onEpicTokenRequired: (g, err) => {
      epicModal.setEpicAuthModalGame(g);
      epicModal.setEpicAuthModalError(err);
      epicModal.setIsEpicAuthModalOpen(true);
    },
  });

  const modal = usePlatformModal({
    accountProfile, onAccountChange, onSteamUserChange, setSteamInput,
    setBannerMsg, updateAccountProfileInMemory: db.updateAccountProfileInMemory,
    persistAccountToSQLite: db.persistAccountToSQLite,
    removeAccountFromSQLite: db.removeAccountFromSQLite,
    handleConnectAndSyncSteam: steam.handleConnectAndSyncSteam,
  });

  return {
    isSyncingSteam: steam.isSyncingSteam, isSyncingXbox: xbox.isSyncingXbox,
    isSyncingEpic: epic.isSyncingEpic, isSyncingGOG: gog.isSyncingGOG,
    syncProgressText, ...modal, ...epicModal,
    syncSingleSteamGame: steam.syncSingleSteamGame,
    enrichEpicGamesAchievements: epic.enrichEpicGamesAchievements,
    persistGamesToSQLite: db.persistGamesToSQLite,
    removeGameFromSQLite: db.removeGameFromSQLite,
    handleConnectAndSyncSteam: steam.handleConnectAndSyncSteam,
    handleConnectAndSyncXbox: xbox.handleConnectAndSyncXbox,
    handleConnectAndSyncEpic: epic.handleConnectAndSyncEpic,
    handleConnectAndSyncGOG: gog.handleConnectAndSyncGOG,
    handleSyncGame: gameHandler.handleSyncGame,
    handleRemoveGame: gameHandler.handleRemoveGame,
    handleUpdateGameStatus: statusHandler.handleUpdateGameStatus,
    handleScanEpicAchievements: epic.handleScanEpicAchievements,
    handleCleanEpicGames: epic.handleCleanEpicGames,
  };
}
