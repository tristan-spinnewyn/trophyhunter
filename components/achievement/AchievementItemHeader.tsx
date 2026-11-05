// components/achievement/AchievementItemHeader.tsx
"use client";

import { Check, AlertTriangle, Eye, Edit3, Target } from "lucide-react";
import type { Achievement } from "@/lib/types";
import type { RarityBadge } from "./AchievementItem.types";
import type { AchievementDescription } from "./achievementDescription";

interface HeaderProps {
  achievement: Achievement;
  isUnlocked: boolean;
  isPinned?: boolean;
  notes: string;
  rarity: RarityBadge;
  description: AchievementDescription;
  onToggleUnlocked: () => void;
  onToggleExpand: () => void;
}

export function AchievementItemHeader({
  achievement,
  isUnlocked,
  isPinned,
  notes,
  rarity,
  description,
  onToggleUnlocked,
  onToggleExpand,
}: HeaderProps) {
  return (
    <div className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3.5">
      <button
        onClick={onToggleUnlocked}
        title={isUnlocked ? "Marquer comme non obtenu" : "Marquer comme obtenu"}
        role="checkbox"
        aria-checked={isUnlocked}
        aria-label={achievement.name}
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-[1.5px] transition active:scale-90 ${
          isUnlocked
            ? "border-platinum bg-platinum text-ink"
            : "border-seam text-transparent hover:border-faint hover:text-seam"
        }`}
      >
        <Check className="h-4 w-4 stroke-[3]" />
      </button>

      <div className="relative shrink-0">
        <img
          src={achievement.icon}
          alt={achievement.name}
          className={`h-11 w-11 sm:h-12 sm:w-12 rounded-object object-cover transition ${
            isUnlocked ? "" : "grayscale opacity-60"
          }`}
          onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
        />
      </div>

      <div className="flex-1 min-w-0 cursor-pointer" onClick={onToggleExpand}>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h3 className={`text-sm sm:text-[15px] font-semibold text-paper`}>
            {achievement.name}
          </h3>
          <span className={`rounded-control border px-1.5 text-[11px] font-medium tabular-nums ${rarity.classes}`}>
            {achievement.percent.toLocaleString("fr-FR")} %, {rarity.label.toLowerCase()}
          </span>
          {isPinned && (
            <span className="flex items-center gap-1 rounded bg-lamp/10 px-1.5 text-[11px] font-medium text-lamp-bright">
              <Target className="h-2.5 w-2.5" /> Cible
            </span>
          )}
          {achievement.missable && (
            <span className="flex items-center gap-1 rounded bg-lamp/10 px-1.5 text-[11px] font-medium text-lamp-bright">
              <AlertTriangle className="h-2.5 w-2.5" /> Manquable
            </span>
          )}
          {achievement.hidden && (
            <span className="flex items-center gap-1 rounded bg-platinum/10 px-1.5 text-[11px] font-medium text-platinum">
              <Eye className="h-2.5 w-2.5" /> Secret
            </span>
          )}
          {notes && (
            <span className="flex items-center gap-1 rounded bg-lamp/10 px-1.5 text-[11px] font-medium text-lamp-bright">
              <Edit3 className="h-2.5 w-2.5" /> Note
            </span>
          )}
        </div>
        <p className={`mt-0.5 text-[13px] leading-snug ${description.isMasked ? "italic text-faint" : "text-dust"}`}>
          {description.text}
        </p>
      </div>
    </div>
  );
}
