// components/achievement/achievementRarity.ts

import type { RarityBadge } from "./AchievementItem.types";

export function getRarityBadge(percent: number): RarityBadge {
  if (percent <= 5.0) {
    return {
      label: "Ultra Rare",
      classes: "border-amber-400/40 bg-amber-500/10 text-amber-300",
    };
  }
  if (percent <= 20.0) {
    return {
      label: "Très Rare",
      classes: "border-purple-400/40 bg-purple-500/10 text-purple-300",
    };
  }
  if (percent <= 50.0) {
    return {
      label: "Rare",
      classes: "border-sky-400/40 bg-sky-500/10 text-sky-300",
    };
  }
  return {
    label: "Commun",
    classes: "border-slate-700 bg-slate-800 text-slate-400",
  };
}
