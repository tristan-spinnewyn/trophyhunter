// app/game/[id]/hooks/useGameOwnershipToggles.ts
"use client";

import type {
  GameDetails,
  OwnedGame,
  UserGameProgress,
  User as UserType,
  PlatformType,
} from "@/lib/types";

interface UseGameOwnershipTogglesProps {
  game: GameDetails | null;
  activePlatform: PlatformType;
  progress: UserGameProgress;
  currentUser: UserType | null;
  favorites: number[];
  setFavorites: (favs: number[]) => void;
  ownedGames: OwnedGame[];
  upsertOwnedGameInMemoryAndDb: (g: OwnedGame) => Promise<any>;
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
      } catch {}
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
      });
    }
  };

  return { handleToggleFavorite, handleToggleOwned };
}
