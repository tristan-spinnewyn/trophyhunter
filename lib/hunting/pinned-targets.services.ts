// lib/hunting/pinned-targets.services.ts

import type { Achievement } from "../types/game";
import { MaxPinnedTargetsExceededError } from "./hunting.types";

export const MAX_PINNED_TARGETS = 5;

export function normalizePinnedIds(pinnedIds: unknown): string[] {
  if (!Array.isArray(pinnedIds)) return [];
  const uniqueIds = new Set<string>();
  for (const item of pinnedIds) {
    if (typeof item === "string" && item.trim().length > 0) {
      uniqueIds.add(item.trim());
    }
  }
  return Array.from(uniqueIds).slice(0, MAX_PINNED_TARGETS);
}

export function isAchievementPinned(
  pinnedIds: readonly string[] | undefined,
  achievementId: string
): boolean {
  if (!pinnedIds || !achievementId) return false;
  return pinnedIds.includes(achievementId);
}

export function canPinMoreTargets(
  pinnedIds: readonly string[] | undefined,
  maxTargets: number = MAX_PINNED_TARGETS
): boolean {
  const count = pinnedIds ? pinnedIds.length : 0;
  return count < maxTargets;
}

export function togglePinnedAchievement(
  pinnedIds: readonly string[] | undefined,
  achievementId: string,
  maxTargets: number = MAX_PINNED_TARGETS
): string[] {
  const trimmedId = achievementId.trim();
  if (!trimmedId) return pinnedIds ? [...pinnedIds] : [];

  const current = pinnedIds ? [...pinnedIds] : [];
  if (current.includes(trimmedId)) {
    return current.filter((id) => id !== trimmedId);
  }

  if (current.length >= maxTargets) {
    throw new MaxPinnedTargetsExceededError(maxTargets);
  }

  return [...current, trimmedId];
}

export function clearUnlockedPinnedAchievements(
  pinnedIds: readonly string[] | undefined,
  unlockedIds: readonly string[]
): string[] {
  if (!pinnedIds || pinnedIds.length === 0) return [];
  const unlockedSet = new Set(unlockedIds);
  return pinnedIds.filter((id) => !unlockedSet.has(id));
}

export function getPinnedAchievementsList(
  achievements: readonly Achievement[],
  pinnedIds: readonly string[] | undefined
): Achievement[] {
  if (!pinnedIds || pinnedIds.length === 0 || achievements.length === 0) {
    return [];
  }
  const byId = new Map<string, Achievement>();
  for (const ach of achievements) {
    byId.set(ach.id, ach);
  }
  const result: Achievement[] = [];
  for (const id of pinnedIds) {
    const found = byId.get(id);
    if (found) result.push(found);
  }
  return result;
}
