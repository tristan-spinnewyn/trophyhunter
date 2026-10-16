// app/game/[id]/hooks/useGameClientController.ts
"use client";

import { useUserData } from "@/context/UserDataContext";
import type { PlatformType } from "@/lib/types";
import { useGameDetails } from "./useGameDetails";
import { useGameProgressActions } from "./useGameProgressActions";
import { useAchievementFilters } from "./useAchievementFilters";

export function useGameClientController(id: string) {
  const appId = parseInt(id, 10);
  const {
    currentUser, ownedGames, accountProfile, steamUser,
    favorites, setFavorites, upsertOwnedGameInMemoryAndDb,
  } = useUserData();

  const owned = ownedGames.find((g) => g.appId === appId);
  const activePlatform: PlatformType = (owned?.platform as PlatformType) || "steam";

  const details = useGameDetails({
    appId, owned, activePlatform, currentUser, accountProfile,
    steamUser, upsertOwnedGameInMemoryAndDb,
  });

  const actions = useGameProgressActions({
    game: details.game, setGame: details.setGame, owned, activePlatform,
    progress: details.progress, setProgress: details.setProgress,
    accountProfile, steamUser, currentUser, favorites, setFavorites,
    ownedGames, upsertOwnedGameInMemoryAndDb,
    setIsSyncing: details.setIsSyncing, setSyncNotice: details.setSyncNotice,
  });

  const filters = useAchievementFilters(details.game?.achievements, details.progress);

  return {
    appId, owned, activePlatform, favorites, ownedGames, accountProfile, steamUser,
    ...details,
    ...actions,
    ...filters,
  };
}
