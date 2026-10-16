// components/dashboard/hooks/platformModalForm.ts

import type { PlatformAccount, PlatformType } from "@/lib/types";
import type { PlatformFormData } from "./usePlatformModal.types";

export const INITIAL_PLATFORM_FORM: PlatformFormData = {
  username: "",
  displayName: "",
  level: "",
  gamesOwned: "",
  totalAchievements: "",
  completedGames: "",
  hoursPlayed: "",
  gamerScore: "",
  platinum: "",
  gold: "",
  silver: "",
  bronze: "",
};

export function createFormFromAccount(existing?: PlatformAccount): PlatformFormData {
  if (!existing) return INITIAL_PLATFORM_FORM;
  return {
    username: existing.username || "",
    displayName: existing.displayName || existing.username || "",
    level: existing.level ? String(existing.level) : "",
    gamesOwned: existing.stats.gamesOwned ? String(existing.stats.gamesOwned) : "",
    totalAchievements: existing.stats.totalAchievements ? String(existing.stats.totalAchievements) : "",
    completedGames: existing.stats.completedGames ? String(existing.stats.completedGames) : "",
    hoursPlayed: existing.stats.hoursPlayed ? String(existing.stats.hoursPlayed) : "",
    gamerScore: existing.stats.gamerScore ? String(existing.stats.gamerScore) : "",
    platinum: existing.stats.trophies?.platinum ? String(existing.stats.trophies.platinum) : "",
    gold: existing.stats.trophies?.gold ? String(existing.stats.trophies.gold) : "",
    silver: existing.stats.trophies?.silver ? String(existing.stats.trophies.silver) : "",
    bronze: existing.stats.trophies?.bronze ? String(existing.stats.trophies.bronze) : "",
  };
}

export function buildAccountFromForm(
  platform: PlatformType,
  form: PlatformFormData,
  existing?: PlatformAccount
): PlatformAccount {
  const platCount = parseInt(form.platinum, 10) || 0;
  const goldCount = parseInt(form.gold, 10) || 0;
  const silverCount = parseInt(form.silver, 10) || 0;
  const bronzeCount = parseInt(form.bronze, 10) || 0;
  const sumTrophies = platCount + goldCount + silverCount + bronzeCount;

  const totalAch = parseInt(form.totalAchievements, 10) || sumTrophies || 0;
  const completed = parseInt(form.completedGames, 10) || platCount || 0;

  return {
    platform,
    username: form.username.trim(),
    displayName: form.displayName.trim() || form.username.trim(),
    level: parseInt(form.level, 10) || undefined,
    connectedAt: existing?.connectedAt || new Date().toISOString(),
    lastSyncedAt: new Date().toISOString(),
    stats: {
      gamesOwned: parseInt(form.gamesOwned, 10) || 0,
      totalAchievements: totalAch,
      completedGames: completed,
      hoursPlayed: parseFloat(form.hoursPlayed) || undefined,
      gamerScore: parseInt(form.gamerScore, 10) || undefined,
      trophies:
        platform === "epic"
          ? {
              platinum: platCount,
              gold: goldCount,
              silver: silverCount,
              bronze: bronzeCount,
            }
          : undefined,
    },
  };
}
