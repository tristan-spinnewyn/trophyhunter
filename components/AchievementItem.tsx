// components/AchievementItem.tsx
"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { AchievementItemProps } from "./achievement/AchievementItem.types";
import { getRarityBadge } from "./achievement/achievementRarity";
import { AchievementItemHeader } from "./achievement/AchievementItemHeader";
import { AchievementDetailsAccordion } from "./achievement/AchievementDetailsAccordion";

export default function AchievementItem({
  achievement,
  gameName,
  gameId,
  isUnlocked,
  notes,
  revealSecret,
  onToggleUnlocked,
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
          : "border-slate-800/90 bg-slate-900/70 hover:border-slate-700"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <AchievementItemHeader
            achievement={achievement}
            isUnlocked={isUnlocked}
            notes={notes}
            rarity={rarity}
            descriptionText={descriptionText}
            onToggleUnlocked={onToggleUnlocked}
            onToggleExpand={() => setIsExpanded(!isExpanded)}
          />
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mr-3 flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-800 hover:text-white"
          title={isExpanded ? "Réduire" : "Voir le guide & notes"}
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
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
