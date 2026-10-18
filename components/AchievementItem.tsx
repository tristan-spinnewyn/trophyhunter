// components/AchievementItem.tsx
"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Pin } from "lucide-react";
import type { AchievementItemProps } from "./achievement/AchievementItem.types";
import { getRarityBadge } from "./achievement/achievementRarity";
import { AchievementItemHeader } from "./achievement/AchievementItemHeader";
import { AchievementDetailsAccordion } from "./achievement/AchievementDetailsAccordion";

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
  const isSecret = achievement.hidden;
  const descriptionText =
    isSecret && !revealSecret && !isUnlocked
      ? "Succès masqué. Clique sur 'Révéler les secrets' pour afficher les détails."
      : achievement.desc;

  return (
    <div
      className={`group rounded-2xl border transition-all duration-200 ${
        isUnlocked
          ? "border-emerald-500/40 bg-emerald-950/20 shadow-sm"
          : isPinned
          ? "border-amber-500/50 bg-amber-950/15 shadow-sm"
          : "border-slate-800/90 bg-slate-900/70 hover:border-slate-700"
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
            descriptionText={descriptionText}
            onToggleUnlocked={onToggleUnlocked}
            onToggleExpand={() => setIsExpanded(!isExpanded)}
          />
        </div>

        <div className="mr-3 flex items-center gap-1">
          {onTogglePinned && (
            <button
              type="button"
              onClick={onTogglePinned}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                isPinned
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : "text-slate-500 hover:bg-slate-800 hover:text-amber-300"
              }`}
              title={isPinned ? "Retirer de la chasse active" : "Épingler en chasse active"}
            >
              <Pin className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-800 hover:text-white"
            title={isExpanded ? "Réduire" : "Voir le guide & notes"}
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
