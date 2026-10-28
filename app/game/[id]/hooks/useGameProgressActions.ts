// app/game/[id]/hooks/useGameProgressActions.ts
"use client";
import { useGameSyncAction } from "./useGameSyncAction";
import { useAchievementToggles } from "./useAchievementToggles";
import { useGameOwnershipToggles } from "./useGameOwnershipToggles";
import type {
  GameDetails,
  OwnedGame,
  UserGameProgress,
  UserAccountProfile,
  User as UserType,
  PlatformType,
} from "@/lib/types";

export interface UseGameProgressActionsParams {
  game: GameDetails | null;
  setGame?: (g: GameDetails) => void;
  owned?: OwnedGame;
  activePlatform: PlatformType;
  progress: UserGameProgress;
  setProgress: (p: UserGameProgress) => void;
  accountProfile: UserAccountProfile;
  steamUser: string;
  currentUser: UserType | null;
  favorites: number[];
  setFavorites: (favs: number[]) => void;
  ownedGames: OwnedGame[];
  upsertOwnedGameInMemoryAndDb: (g: OwnedGame) => Promise<any>;
  setIsSyncing: (s: boolean) => void;
  setSyncNotice: (n: { type: "success" | "error"; msg: string } | null) => void;
}

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
