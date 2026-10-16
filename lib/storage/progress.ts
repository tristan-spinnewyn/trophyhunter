// lib/storage/progress.ts
import type { UserGameProgress, PlatformType } from "../types";
import { PREFIX } from "./constants";
import { getOwnedGames, saveOwnedGames, upsertOwnedGames } from "./games";
import { addRecentGame } from "./preferences";

function syncOwnedOnProgressSave(
  appId: number,
  progress: UserGameProgress,
  gameMeta?: { name: string; headerImg: string; totalAchievements: number; platform?: PlatformType }
): void {
  const owned = getOwnedGames();
  const idx = owned.findIndex((g) => g.appId === appId);
  if (idx !== -1) {
    owned[idx] = {
      ...owned[idx],
      unlockedCount: progress.unlockedIds.length,
      totalAchievements: gameMeta?.totalAchievements || owned[idx].totalAchievements,
      lastPlayed: progress.lastPlayed || new Date().toISOString(),
    };
    saveOwnedGames(owned);
  } else if (gameMeta && progress.unlockedIds.length > 0) {
    upsertOwnedGames([{
      appId,
      name: gameMeta.name,
      headerImg: gameMeta.headerImg,
      platform: gameMeta.platform || "steam",
      totalAchievements: gameMeta.totalAchievements,
      unlockedCount: progress.unlockedIds.length,
      lastPlayed: progress.lastPlayed || new Date().toISOString(),
      addedAt: new Date().toISOString(),
      source: "manual",
    }]);
  }
}

export function getGameProgress(appId: number): UserGameProgress {
  if (typeof window === "undefined") return { unlockedIds: [], notes: {} };
  try {
    const raw = localStorage.getItem(`${PREFIX}${appId}`);
    return raw ? JSON.parse(raw) : { unlockedIds: [], notes: {} };
  } catch {
    return { unlockedIds: [], notes: {} };
  }
}

export function saveGameProgress(
  appId: number,
  progress: UserGameProgress,
  gameMeta?: { name: string; headerImg: string; totalAchievements: number; platform?: PlatformType }
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${PREFIX}${appId}`, JSON.stringify(progress));
    addRecentGame(appId);
    syncOwnedOnProgressSave(appId, progress, gameMeta);
  } catch (err) {
    console.error("Failed to save progress to localStorage:", err);
  }
}

export function toggleAchievementUnlocked(
  appId: number,
  achievementId: string,
  gameMeta?: { name: string; headerImg: string; totalAchievements: number }
): UserGameProgress {
  const current = getGameProgress(appId);
  const exists = current.unlockedIds.includes(achievementId);
  const updatedIds = exists
    ? current.unlockedIds.filter((id) => id !== achievementId)
    : [...current.unlockedIds, achievementId];

  const updated: UserGameProgress = {
    ...current,
    unlockedIds: updatedIds,
    lastPlayed: new Date().toISOString(),
  };

  saveGameProgress(appId, updated, gameMeta);
  return updated;
}

export function setAchievementNote(appId: number, achievementId: string, note: string): UserGameProgress {
  const current = getGameProgress(appId);
  const updated: UserGameProgress = { ...current, notes: { ...current.notes, [achievementId]: note } };
  saveGameProgress(appId, updated);
  return updated;
}

export function resetGameProgress(appId: number): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(`${PREFIX}${appId}`);
  const owned = getOwnedGames();
  const idx = owned.findIndex((g) => g.appId === appId);
  if (idx !== -1) {
    owned[idx] = { ...owned[idx], unlockedCount: 0 };
    saveOwnedGames(owned);
  }
}
