// components/achievement/AchievementItem.tsx
"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Pin } from "lucide-react";
import type { AchievementItemProps } from "./AchievementItem.types";
import { getRarityBadge } from "./achievementRarity";
import { AchievementItemHeader } from "./AchievementItemHeader";
import { AchievementDetailsAccordion } from "./AchievementDetailsAccordion";
import { getAchievementDescription } from "./achievementDescription";

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
      className={`group border-b border-edge/70 transition-colors ${
        isPinned ? "rounded-r-control border-l-[3px] border-l-lamp bg-plank" : "hover:bg-plank/50"
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
              className={`flex h-9 w-9 items-center justify-center rounded-control transition ${
                isPinned
                  ? "text-lamp-bright"
                  : "text-faint hover:bg-edge hover:text-lamp-bright"
              }`}
              title={isPinned ? "Retirer de la chasse active" : "Épingler en chasse active"}
              aria-label={isPinned ? "Retirer de la chasse active" : "Épingler en chasse active"}
              aria-pressed={isPinned}
            >
              <Pin className={`h-4 w-4 ${isPinned ? "fill-lamp-bright" : ""}`} />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex h-9 w-9 items-center justify-center rounded-control text-faint hover:bg-edge hover:text-paper"
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
