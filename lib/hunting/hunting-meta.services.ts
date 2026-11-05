// lib/hunting/hunting-meta.services.ts

import type { Achievement } from "../types/game";
import type { GameHuntingMeta, GameHuntingOverride } from "./hunting.types";
import { detectHuntingWarning } from "./hunting-warning.services";
import { getDefaultWarningMessageForType } from "./hunting-override.services";

const MULTIPLE_RUN_KEYWORDS: readonly string[] = [
  "new game+", "ng+", "nouvelle partie+", "deuxième partie", "second playthrough",
] as const;

export function getDifficultyMeta(rating: number): {
  readonly label: string;
  readonly badgeClass: string;
} {
  if (rating <= 2) return { label: "Très facile", badgeClass: "border-done/40 bg-done/15 text-done" };
  if (rating <= 4) return { label: "Facile", badgeClass: "border-lamp/40 bg-lamp/15 text-lamp-bright" };
  if (rating <= 6) return { label: "Moyen", badgeClass: "border-lamp/40 bg-lamp/15 text-lamp-bright" };
  if (rating <= 8) return { label: "Difficile", badgeClass: "border-danger/40 bg-danger/15 text-danger" };
  return { label: "Extrême", badgeClass: "border-danger/40 bg-danger/15 text-danger" };
}

export function estimateGameDifficulty(achievements: readonly Achievement[]): number {
  if (achievements.length === 0) return 1;

  const validPercents = achievements.map((a) => a.percent).filter((p) => p > 0);
  const minPercent = validPercents.length > 0 ? Math.min(...validPercents) : 50;
  const ultraRareCount = achievements.filter((a) => a.percent > 0 && a.percent < 1.5).length;
  const missableCount = achievements.filter((a) => a.missable).length;

  let score = 8;
  if (minPercent >= 25) score = 2;
  else if (minPercent >= 10) score = 3;
  else if (minPercent >= 5) score = 5;
  else if (minPercent >= 2) score = 6;
  else if (minPercent >= 0.8) score = 7;

  if (ultraRareCount >= 5) score += 1;
  if (missableCount >= 5) score += 1;

  return Math.max(1, Math.min(10, score));
}

export function estimateCompletionHours(
  achievements: readonly Achievement[],
  difficultyRating: number
): number {
  if (achievements.length === 0) return 5;
  const baseHours = Math.round(achievements.length * 0.65);
  const multiplier = 0.7 + difficultyRating * 0.12;
  return Math.max(2, Math.min(300, Math.round(baseHours * multiplier)));
}

export function estimateMinPlaythroughs(achievements: readonly Achievement[]): number {
  for (const ach of achievements) {
    const text = `${ach.name} ${ach.desc || ""}`.toLowerCase();
    if (MULTIPLE_RUN_KEYWORDS.some((kw) => text.includes(kw))) return 2;
  }
  return 1;
}

export function computeGameHuntingMeta(
  achievements: readonly Achievement[],
  override?: GameHuntingOverride
): GameHuntingMeta {
  const autoDifficulty = estimateGameDifficulty(achievements);
  const difficultyRating = override?.difficultyRating ?? autoDifficulty;
  const difficultyMeta = getDifficultyMeta(difficultyRating);
  const estimatedHours = override?.estimatedHours ?? estimateCompletionHours(achievements, difficultyRating);
  const minPlaythroughs = override?.minPlaythroughs ?? estimateMinPlaythroughs(achievements);
  const missableCount = achievements.filter((a) => a.missable).length;
  const detected = detectHuntingWarning(achievements);
  const warningType = override?.warningType ?? detected.warningType;
  const warningMessage =
    override?.warningMessage ??
    (override?.warningType !== undefined ? getDefaultWarningMessageForType(override.warningType) : detected.warningMessage);

  return {
    difficultyRating,
    difficultyLabel: difficultyMeta.label,
    difficultyBadgeClass: difficultyMeta.badgeClass,
    estimatedHours,
    minPlaythroughs,
    missableCount,
    onlineCount: detected.onlineCount,
    warningType,
    warningMessage,
    isCustomOverride: Boolean(override && Object.keys(override).length > 0),
  };
}
