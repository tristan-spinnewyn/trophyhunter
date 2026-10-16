// app/game/[id]/hooks/useGameProgressActions.ts
"use client";

import type { UseGameProgressActionsParams } from "./useGameProgressActions.types";
import { useGameSyncAction } from "./useGameSyncAction";
import { useAchievementToggles } from "./useAchievementToggles";
import { useGameOwnershipToggles } from "./useGameOwnershipToggles";

export function useGameProgressActions({
  game,
  setGame,
  owned,
  activePlatform,
  progress,
  setProgress,
  accountProfile,
  steamUser,
  currentUser,
  favorites,
  setFavorites,
  ownedGames,
  upsertOwnedGameInMemoryAndDb,
  setIsSyncing,
  setSyncNotice,
}: UseGameProgressActionsParams) {
  const syncAction = useGameSyncAction({
    game,
    setGame,
    owned,
    activePlatform,
    progress,
    setProgress,
    accountProfile,
    steamUser,
    currentUser,
    upsertOwnedGameInMemoryAndDb,
    setIsSyncing,
    setSyncNotice,
  });

  const achievementToggles = useAchievementToggles({
    game,
    owned,
    activePlatform,
    progress,
    setProgress,
    currentUser,
    upsertOwnedGameInMemoryAndDb,
  });

  const ownershipToggles = useGameOwnershipToggles({
    game,
    activePlatform,
    progress,
    currentUser,
    favorites,
    setFavorites,
    ownedGames,
    upsertOwnedGameInMemoryAndDb,
  });

  return {
    ...syncAction,
    ...achievementToggles,
    ...ownershipToggles,
  };
}
