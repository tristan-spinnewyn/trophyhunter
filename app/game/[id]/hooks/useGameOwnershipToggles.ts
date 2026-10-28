// app/game/[id]/hooks/useGameOwnershipToggles.ts
"use client";

import type {
  GameDetails,
  GameStatus,
  OwnedGame,
  UserGameProgress,
  User as UserType,
  PlatformType,
} from "@/lib/types";
import { assertValidGameStatus } from "@/lib/game-status/game-status.services";

interface UseGameOwnershipTogglesProps {
  readonly game: GameDetails | null;
  readonly activePlatform: PlatformType;
  readonly progress: UserGameProgress;
  readonly currentUser: UserType | null;
  readonly favorites: number[];
  readonly setFavorites: (favs: number[]) => void;
  readonly ownedGames: OwnedGame[];
  readonly upsertOwnedGameInMemoryAndDb: (g: OwnedGame) => Promise<unknown>;
}

export function useGameOwnershipToggles({
  game,
  activePlatform,
  progress,
  currentUser,
  favorites,
  setFavorites,
  ownedGames,
  upsertOwnedGameInMemoryAndDb,
}: UseGameOwnershipTogglesProps) {
  const handleToggleFavorite = async () => {
    if (!game) return;
    const isFav = favorites.includes(game.id);
    const updated = isFav
      ? favorites.filter((id) => id !== game.id)
      : [...favorites, game.id];
    setFavorites(updated);

    if (currentUser) {
      try {
        await fetch("/api/user/favorite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ appId: game.id, platform: activePlatform, isFavorite: !isFav }),
        });
      } catch (e) {
        console.error("Failed to toggle favorite:", e);
      }
    }
  };

  const handleToggleOwned = async () => {
    if (!game) return;
    const isCurrentlyOwned = ownedGames.some((g) => g.appId === game.id);
    if (isCurrentlyOwned) {
      if (currentUser) {
        await fetch(`/api/user/games?appId=${game.id}&platform=${activePlatform}`, { method: "DELETE" });
      }
    } else {
      await upsertOwnedGameInMemoryAndDb({
        appId: game.id,
        name: game.name,
        headerImg: game.headerImg,
        platform: activePlatform,
        totalAchievements: game.totalAchievements,
        unlockedCount: progress.unlockedIds.length,
        addedAt: new Date().toISOString(),
        source: "manual",
        status: "backlog",
      });
    }
  };

  const handleChangeGameStatus = async (status: GameStatus) => {
    if (!game) return;
    const validStatus = assertValidGameStatus(status);
    const existing = ownedGames.find((g) => g.appId === game.id && g.platform === activePlatform);
    await upsertOwnedGameInMemoryAndDb({
      appId: game.id,
      name: existing?.name || game.name,
      headerImg: existing?.headerImg || game.headerImg,
      platform: activePlatform,
      totalAchievements: existing?.totalAchievements || game.totalAchievements,
      unlockedCount: Math.max(existing?.unlockedCount || 0, progress.unlockedIds.length),
      playtimeHours: existing?.playtimeHours,
      lastPlayed: existing?.lastPlayed,
      addedAt: existing?.addedAt || new Date().toISOString(),
      source: existing?.source || "manual",
      status: validStatus,
    });
  };

  return { handleToggleFavorite, handleToggleOwned, handleChangeGameStatus };
}
