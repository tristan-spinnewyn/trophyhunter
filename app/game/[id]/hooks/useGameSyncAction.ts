// app/game/[id]/hooks/useGameSyncAction.ts
"use client";

import type { UseGameSyncActionParams } from "./useGameSyncAction.types";
import { useGameEpicSync } from "./useGameEpicSync";
import { useGameSteamSync } from "./useGameSteamSync";

export function useGameSyncAction(params: UseGameSyncActionParams) {
  const { activePlatform } = params;

  const epic = useGameEpicSync({
    game: params.game,
    setGame: params.setGame,
    owned: params.owned,
    progress: params.progress,
    setProgress: params.setProgress,
    accountProfile: params.accountProfile,
    currentUser: params.currentUser,
    upsertOwnedGameInMemoryAndDb: params.upsertOwnedGameInMemoryAndDb,
    setIsSyncing: params.setIsSyncing,
    setSyncNotice: params.setSyncNotice,
  });

  const steam = useGameSteamSync({
    game: params.game,
    owned: params.owned,
    progress: params.progress,
    setProgress: params.setProgress,
    accountProfile: params.accountProfile,
    steamUser: params.steamUser,
    currentUser: params.currentUser,
    upsertOwnedGameInMemoryAndDb: params.upsertOwnedGameInMemoryAndDb,
    setIsSyncing: params.setIsSyncing,
    setSyncNotice: params.setSyncNotice,
  });

  const handleSync = async () => {
    if (activePlatform === "epic") {
      await epic.executeEpicSync();
    } else {
      await steam.executeSteamSync();
    }
  };

  return {
    handleSync,
    isEpicAuthModalOpen: epic.isEpicAuthModalOpen,
    setIsEpicAuthModalOpen: epic.setIsEpicAuthModalOpen,
    openEpicAuthModal: epic.openEpicAuthModal,
    epicAuthModalError: epic.epicAuthModalError,
    handleEpicAuthSubmit: epic.handleEpicAuthSubmit,
  };
}
