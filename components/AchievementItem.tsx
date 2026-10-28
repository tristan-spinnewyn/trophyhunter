// components/AchievementItem.tsx
"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Pin } from "lucide-react";
import type { AchievementItemProps } from "./achievement/AchievementItem.types";
import { getRarityBadge } from "./achievement/achievementRarity";
import { AchievementItemHeader } from "./achievement/AchievementItemHeader";
import { AchievementDetailsAccordion } from "./achievement/AchievementDetailsAccordion";
import { getAchievementDescription } from "./achievement/achievementDescription";

export default function AchievementItem({
  achievement,
  gameName,
  gameId,
  isUnlocked,
  isPinned = false,
  notes,
  revealSecret,
  onToggleUnlocked,
  onTogglePinned,
  onSaveNotes,
}: AchievementItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const rarity = getRarityBadge(achievement.percent);
  const description = getAchievementDescription(achievement, { revealSecret, isUnlocked });

  return (
    <div
      className={`group rounded-xl border transition-colors ${
        isUnlocked
          ? "border-emerald-500/25 bg-emerald-950/15"
          : isPinned
          ? "border-amber-500/40 bg-amber-950/10"
          : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <AchievementItemHeader
            achievement={achievement}
            isUnlocked={isUnlocked}
            isPinned={isPinned}
            notes={notes}
            rarity={rarity}
            description={description}
            onToggleUnlocked={onToggleUnlocked}
            onToggleExpand={() => setIsExpanded(!isExpanded)}
          />
        </div>

        <div className="mr-1.5 sm:mr-3 flex items-center">
          {onTogglePinned && (
            <button
              type="button"
              onClick={onTogglePinned}
              className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${
                isPinned
                  ? "text-amber-300"
                  : "text-slate-500 hover:bg-slate-800 hover:text-amber-300"
              }`}
              title={isPinned ? "Retirer de la chasse active" : "Épingler en chasse active"}
              aria-label={isPinned ? "Retirer de la chasse active" : "Épingler en chasse active"}
              aria-pressed={isPinned}
            >
              <Pin className={`h-4 w-4 ${isPinned ? "fill-amber-300" : ""}`} />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-800 hover:text-white"
            title={isExpanded ? "Réduire" : "Voir le guide & notes"}
            aria-label={isExpanded ? "Réduire" : "Voir le guide & notes"}
            aria-expanded={isExpanded}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <AchievementDetailsAccordion
          gameName={gameName}
          achievementName={achievement.name}
          gameId={gameId}
          initialNotes={notes}
          onSaveNotes={onSaveNotes}
        />
      )}
    </div>
  );
}
