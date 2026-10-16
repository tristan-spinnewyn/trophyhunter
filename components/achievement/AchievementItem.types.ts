// components/achievement/AchievementItem.types.ts

import type { Achievement } from "@/lib/types";

export interface AchievementItemProps {
  achievement: Achievement;
  gameName: string;
  gameId: number;
  isUnlocked: boolean;
  notes: string;
  revealSecret: boolean;
  onToggleUnlocked: () => void;
  onSaveNotes: (notes: string) => void;
}

export interface RarityBadge {
  label: string;
  classes: string;
}
