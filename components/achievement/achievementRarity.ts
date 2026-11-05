// components/achievement/achievementRarity.ts

import type { RarityBadge } from "./AchievementItem.types";

export function getRarityBadge(percent: number): RarityBadge {
  if (percent <= 5.0) {
    return {
      label: "Ultra Rare",
      classes: "border-platinum bg-platinum text-ink",
    };
  }
  if (percent <= 20.0) {
    return {
      label: "Très Rare",
      classes: "border-platinum/40 bg-platinum/10 text-platinum",
    };
  }
  if (percent <= 50.0) {
    return {
      label: "Rare",
      classes: "border-edge text-paper-dim",
    };
  }
  return {
    label: "Commun",
    classes: "border-transparent text-dust",
  };
}
