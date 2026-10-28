// app/game/[id]/components/AchievementsListSection.tsx
"use client";

import AchievementItem from "@/components/achievement/AchievementItem";
import type { Achievement, GameDetails, UserGameProgress } from "@/lib/types";
import { isAchievementPinned } from "@/lib/hunting/pinned-targets.services";

interface ListSectionProps {
  readonly displayedAchievements: Achievement[];
  readonly game: GameDetails;
  readonly progress: UserGameProgress;
  readonly revealSecrets: boolean;
  readonly onToggleAchievement: (id: string) => void;
  readonly onTogglePinAchievement?: (id: string) => void;
  readonly onSaveNotes: (id: string, notes: string) => void;
  readonly onResetFilters: () => void;
}

export function AchievementsListSection({
  displayedAchievements,
  game,
  progress,
  revealSecrets,
  onToggleAchievement,
  onTogglePinAchievement,
  onSaveNotes,
  onResetFilters,
}: ListSectionProps) {
  if (game.totalAchievements <= 0 && game.achievements.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center text-slate-400">
        <p className="text-sm font-medium">
          Ce jeu ne comporte aucun succès répertorié sur cette plateforme.
        </p>
      </div>
    );
  }

  if (displayedAchievements.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center text-slate-400 space-y-2">
        <p className="text-sm font-medium">Aucun succès ne correspond à ce filtre.</p>
        <button
          onClick={onResetFilters}
          className="text-xs text-sky-400 underline hover:text-sky-300"
        >
          Réinitialiser les filtres
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {displayedAchievements.map((ach) => (
        <AchievementItem
          key={ach.id}
          achievement={ach}
          gameName={game.name}
          gameId={game.id}
          isUnlocked={progress.unlockedIds.includes(ach.id)}
          isPinned={isAchievementPinned(progress.pinnedIds, ach.id)}
          notes={progress.notes[ach.id] || ""}
          revealSecret={revealSecrets}
          onToggleUnlocked={() => onToggleAchievement(ach.id)}
          onTogglePinned={
            onTogglePinAchievement ? () => onTogglePinAchievement(ach.id) : undefined
          }
          onSaveNotes={(noteText) => onSaveNotes(ach.id, noteText)}
        />
      ))}
    </div>
  );
}
