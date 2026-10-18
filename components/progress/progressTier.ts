// components/progress/progressTier.ts

import confetti from "canvas-confetti";
import type { ProgressTier } from "./ProgressTracker.types";

export function fireCompletionConfetti() {
  confetti({
    particleCount: 120,
    spread: 80,
    origin: { y: 0.6 },
    colors: ["#38bdf8", "#fbbf24", "#34d399", "#818cf8"],
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
      color: "text-slate-400 border-slate-700/50",
    };
  }
  if (isComplete) {
    return {
      name: "Platine Obtenu ! 🏆",
      color: "from-sky-400 to-indigo-400 text-sky-400 border-sky-500/50",
    };
  }
  if (percent >= 75) {
    return {
      name: "Rang Or 🥇",
      color: "from-amber-400 to-yellow-500 text-amber-400 border-amber-500/50",
    };
  }
  if (percent >= 40) {
    return {
      name: "Rang Argent 🥈",
      color: "from-slate-300 to-slate-400 text-slate-300 border-slate-500/50",
    };
  }
  return {
    name: "Rang Bronze 🥉",
    color: "from-amber-600 to-amber-800 text-amber-600 border-amber-700/50",
  };
}
