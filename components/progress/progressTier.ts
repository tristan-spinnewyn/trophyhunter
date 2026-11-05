// components/progress/progressTier.ts

import confetti from "canvas-confetti";
import type { ProgressTier } from "./ProgressTracker.types";

export function fireCompletionConfetti() {
  confetti({
    particleCount: 120,
    spread: 80,
    origin: { y: 0.6 },
    colors: ["#f4c152", "#c9d1d9", "#7cc49a", "#ece6da"],
  });
}

export function getProgressTier(
  isComplete: boolean,
  percent: number,
  total = 1
): ProgressTier {
  if (total <= 0) {
    return {
      name: "Sans succès",
      color: "text-dust border-seam/50",
    };
  }
  if (isComplete) {
    return {
      name: "Platine Obtenu ! 🏆",
      color: "text-platinum border-platinum/50",
    };
  }
  if (percent >= 75) {
    return {
      name: "Rang Or 🥇",
      color: "text-paper border-paper/40",
    };
  }
  if (percent >= 40) {
    return {
      name: "Rang Argent 🥈",
      color: "text-paper-dim border-faint/50",
    };
  }
  return {
    name: "Rang Bronze 🥉",
    color: "text-dropped border-dropped/50",
  };
}

/**
 * Achievements the platform reports as unlocked while the checklist is still empty
 * (imported counts without per-achievement detail). Null once the checklist is used.
 */
export function getUntrackedUnlockedCount(checklistCount: number, importedCount: number | undefined): number | null {
  if (checklistCount > 0 || !importedCount) return null;
  return importedCount;
}
