// lib/hunting/hunting-warning.services.ts

import type { Achievement } from "../types/game";
import type { HuntingWarningType } from "./hunting.types";

export const VALID_WARNING_TYPES: readonly HuntingWarningType[] = [
  "none",
  "online-required",
  "unobtainable",
  "bugged",
] as const;

export const ONLINE_KEYWORDS: readonly string[] = [
  "multijoueur", "multiplayer", "en ligne", "online", "coop", "co-op",
  "classé", "ranked", "matchmaking", "pvp", "serveur", "leaderboard",
] as const;

export const UNOBTAINABLE_KEYWORDS: readonly string[] = [
  "serveurs fermés", "server closed", "discontinued",
  "unobtainable", "inobtenable", "événement terminé",
] as const;

export function isValidHuntingWarningType(value: unknown): value is HuntingWarningType {
  return typeof value === "string" && (VALID_WARNING_TYPES as readonly string[]).includes(value);
}

export function isOnlineAchievement(achievement: Pick<Achievement, "name" | "desc">): boolean {
  const combined = `${achievement.name} ${achievement.desc || ""}`.toLowerCase();
  return ONLINE_KEYWORDS.some((keyword) => combined.includes(keyword));
}

export function isUnobtainableAchievement(
  achievement: Pick<Achievement, "name" | "desc" | "percent">,
  hasActivePopulation: boolean
): boolean {
  const combined = `${achievement.name} ${achievement.desc || ""}`.toLowerCase();
  if (UNOBTAINABLE_KEYWORDS.some((kw) => combined.includes(kw))) return true;
  return hasActivePopulation && achievement.percent === 0 && isOnlineAchievement(achievement);
}

export function detectHuntingWarning(achievements: readonly Achievement[]): {
  readonly warningType: HuntingWarningType;
  readonly warningMessage: string | null;
  readonly onlineCount: number;
} {
  if (achievements.length === 0) {
    return { warningType: "none", warningMessage: null, onlineCount: 0 };
  }

  const maxPercent = Math.max(...achievements.map((a) => a.percent || 0));
  const hasActivePopulation = maxPercent > 5;

  let onlineCount = 0;
  let unobtainableCount = 0;

  for (const ach of achievements) {
    if (isOnlineAchievement(ach)) onlineCount++;
    if (isUnobtainableAchievement(ach, hasActivePopulation)) unobtainableCount++;
  }

  if (unobtainableCount > 0) {
    return {
      warningType: "unobtainable",
      warningMessage: `${unobtainableCount} succès potentiellement inobtenable(s) (serveurs fermés ou taux 0%).`,
      onlineCount,
    };
  }

  if (onlineCount > 0) {
    return {
      warningType: "online-required",
      warningMessage: `${onlineCount} succès multijoueur / en ligne requis pour le 100%.`,
      onlineCount,
    };
  }

  return { warningType: "none", warningMessage: null, onlineCount: 0 };
}
