// app/game/[id]/hooks/gameEpicSyncData.ts

import type { GameDetails, OwnedGame, UserGameProgress } from "@/lib/types";

interface ApplySyncDataParams {
  data: any;
  game: GameDetails;
  setGame?: (g: GameDetails) => void;
  owned?: OwnedGame;
  progress: UserGameProgress;
  setProgress: (p: UserGameProgress) => void;
  upsertOwnedGameInMemoryAndDb: (g: OwnedGame) => Promise<any>;
}

export async function applyGameEpicSyncData({
  data,
  game,
  setGame,
  owned,
  progress,
  setProgress,
  upsertOwnedGameInMemoryAndDb,
}: ApplySyncDataParams): Promise<{ newUnlockedIds: string[]; resolvedTotal: number; updatedProgress: UserGameProgress }> {
  let currentAchievements = game.achievements;
  if (Array.isArray(data.achievements) && data.achievements.length > 0) {
    currentAchievements = data.achievements;
    if (setGame) setGame({ ...game, achievements: data.achievements, totalAchievements: data.achievements.length });
  }

  const normalize = (s: string) => s.replace(/[’']/g, "'").trim().toLowerCase();
  const unlockedTitles: string[] = data.unlockedTitles || [];
  const returnedUnlockedIds: string[] = data.unlockedIds || [];
  const matched = currentAchievements
    .filter((a) => returnedUnlockedIds.includes(a.id) || unlockedTitles.some((t) => normalize(t) === normalize(a.name)))
    .map((a) => a.id);

  const newUnlockedIds = Array.from(new Set([...progress.unlockedIds, ...matched, ...(returnedUnlockedIds.length > 0 && matched.length === 0 ? returnedUnlockedIds : [])]));
  const updatedProgress: UserGameProgress = { ...progress, unlockedIds: newUnlockedIds, lastPlayed: new Date().toISOString() };
  setProgress(updatedProgress);

  const resolvedTotal = data.totalAchievements || currentAchievements.length || game.totalAchievements;
  if (owned) {
    await upsertOwnedGameInMemoryAndDb({ ...owned, totalAchievements: resolvedTotal, unlockedCount: Math.max(owned.unlockedCount || 0, newUnlockedIds.length) });
  }

  return { newUnlockedIds, resolvedTotal, updatedProgress };
}
