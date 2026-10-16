"use client";

import type {
  GameDetails,
  OwnedGame,
  UserGameProgress,
  UserAccountProfile,
  User as UserType,
  PlatformType,
} from "@/lib/types";
import { useGameSyncAction } from "./useGameSyncAction";

interface UseGameProgressActionsParams {
  game: GameDetails | null;
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
  const { handleSync } = useGameSyncAction({
    game,
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

  // Toggle achievement checkbox
  const handleToggleAchievement = async (achId: string) => {
    if (!game) return;
    const isCurrentlyUnlocked = progress.unlockedIds.includes(achId);
    const nextUnlockedIds = isCurrentlyUnlocked
      ? progress.unlockedIds.filter((id) => id !== achId)
      : [...progress.unlockedIds, achId];

    const updated: UserGameProgress = {
      ...progress,
      unlockedIds: nextUnlockedIds,
      lastPlayed: new Date().toISOString(),
    };
    setProgress(updated);

    if (owned || game) {
      await upsertOwnedGameInMemoryAndDb({
        appId: game.id,
        name: owned?.name || game.name,
        headerImg: owned?.headerImg || game.headerImg || "",
        platform: activePlatform,
        totalAchievements: game.totalAchievements,
        unlockedCount: nextUnlockedIds.length,
        playtimeHours: owned?.playtimeHours,
        lastPlayed: updated.lastPlayed,
        addedAt: owned?.addedAt || new Date().toISOString(),
        source: owned?.source || "manual",
      });
    }

    if (currentUser) {
      try {
        await fetch("/api/user/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            appId: game.id,
            platform: activePlatform,
            progress: updated,
          }),
        });
      } catch (err) {
        console.error("Failed to persist progress:", err);
      }
    }
  };

  // Save notes
  const handleSaveNotes = async (achId: string, noteText: string) => {
    if (!game) return;
    const nextNotes = { ...progress.notes };
    if (!noteText.trim()) {
      delete nextNotes[achId];
    } else {
      nextNotes[achId] = noteText.trim();
    }
    const updated: UserGameProgress = {
      ...progress,
      notes: nextNotes,
    };
    setProgress(updated);

    if (currentUser) {
      try {
        await fetch("/api/user/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            appId: game.id,
            platform: activePlatform,
            progress: updated,
          }),
        });
      } catch (err) {
        console.error("Failed to persist note:", err);
      }
    }
  };

  // Reset progress
  const handleResetProgress = async () => {
    if (!game) return;
    setProgress({ unlockedIds: [], notes: {} });

    if (owned) {
      await upsertOwnedGameInMemoryAndDb({
        ...owned,
        unlockedCount: 0,
      });
    }

    if (currentUser) {
      try {
        await fetch(
          `/api/user/progress?appId=${game.id}&platform=${activePlatform}`,
          { method: "DELETE" }
        );
      } catch {}
    }
  };

  // Toggle favorite
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
          body: JSON.stringify({
            appId: game.id,
            platform: activePlatform,
            isFavorite: !isFav,
          }),
        });
      } catch {}
    }
  };

  // Toggle owned
  const handleToggleOwned = async () => {
    if (!game) return;
    const isCurrentlyOwned = ownedGames.some((g) => g.appId === game.id);
    if (isCurrentlyOwned) {
      if (currentUser) {
        await fetch(
          `/api/user/games?appId=${game.id}&platform=${activePlatform}`,
          { method: "DELETE" }
        );
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

  return {
    handleSync,
    handleToggleAchievement,
    handleSaveNotes,
    handleResetProgress,
    handleToggleFavorite,
    handleToggleOwned,
  };
}
