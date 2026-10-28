// app/game/[id]/hooks/useAchievementToggles.ts
"use client";

import type {
  GameDetails,
  OwnedGame,
  UserGameProgress,
  User as UserType,
  PlatformType,
} from "@/lib/types";
import { saveProgressApi, deleteProgressApi } from "./progressApi";

interface UseAchievementTogglesProps {
  game: GameDetails | null;
  owned?: OwnedGame;
  activePlatform: PlatformType;
  progress: UserGameProgress;
  setProgress: (p: UserGameProgress) => void;
  currentUser: UserType | null;
  upsertOwnedGameInMemoryAndDb: (g: OwnedGame) => Promise<void>;
}

export function useAchievementToggles({
  game,
  owned,
  activePlatform,
  progress,
  setProgress,
  currentUser,
  upsertOwnedGameInMemoryAndDb,
}: UseAchievementTogglesProps) {
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

    if (currentUser) await saveProgressApi(game.id, activePlatform, updated);
  };

  const handleSaveNotes = async (achId: string, noteText: string) => {
    if (!game) return;
    const nextNotes = { ...progress.notes };
    if (!noteText.trim()) delete nextNotes[achId];
    else nextNotes[achId] = noteText.trim();

    const updated: UserGameProgress = { ...progress, notes: nextNotes };
    setProgress(updated);
    if (currentUser) await saveProgressApi(game.id, activePlatform, updated);
  };

  const handleResetProgress = async () => {
    if (!game) return;
    setProgress({ unlockedIds: [], notes: {} });
    if (owned) await upsertOwnedGameInMemoryAndDb({ ...owned, unlockedCount: 0 });
    if (currentUser) await deleteProgressApi(game.id, activePlatform);
  };

  return { handleToggleAchievement, handleSaveNotes, handleResetProgress };
}
