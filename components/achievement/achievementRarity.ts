// components/achievement/achievementRarity.ts

import type { RarityBadge } from "./AchievementItem.types";

export function getRarityBadge(percent: number): RarityBadge {
  if (percent <= 5.0) {
    return {
      label: "Ultra Rare",
      classes: "border-lamp-bright/40 bg-lamp/10 text-lamp-bright",
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
      classes: "border-lamp-bright/40 bg-lamp/10 text-lamp-bright",
    };
  }
  return {
    label: "Commun",
    classes: "border-seam bg-edge text-dust",
  };
}
