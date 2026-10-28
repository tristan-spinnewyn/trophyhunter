// components/achievement/achievementDescription.ts

import type { Achievement } from "@/lib/types";

export const HIDDEN_ACHIEVEMENT_TEXT = "Description masquée";

export interface AchievementDescription {
  readonly text: string;
  readonly isMasked: boolean;
}

export function getAchievementDescription(
  achievement: Pick<Achievement, "hidden" | "desc">,
  { revealSecret, isUnlocked }: { revealSecret: boolean; isUnlocked: boolean },
): AchievementDescription {
  if (achievement.hidden && !revealSecret && !isUnlocked) {
    return { text: HIDDEN_ACHIEVEMENT_TEXT, isMasked: true };
  }
  return { text: achievement.desc, isMasked: false };
}
