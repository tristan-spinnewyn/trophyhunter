// components/hunting/ActiveHuntPanel.tsx
"use client";

import { Pin, Target, Trash2, Sparkles } from "lucide-react";
import type { Achievement } from "@/lib/types";
import { MAX_PINNED_TARGETS } from "@/lib/hunting/pinned-targets.services";
import { ActiveHuntTargetRow } from "./ActiveHuntTargetRow";

interface ActiveHuntPanelProps {
  readonly pinnedAchievements: readonly Achievement[];
  readonly unlockedIds: readonly string[];
  readonly notes: Readonly<Record<string, string>>;
  readonly onToggleUnlocked: (achievementId: string) => void;
  readonly onUnpin: (achievementId: string) => void;
  readonly onClearUnlocked: () => void;
  readonly onClearAll: () => void;
}

export function ActiveHuntPanel({
  pinnedAchievements,
  unlockedIds,
  notes,
  onToggleUnlocked,
  onUnpin,
  onClearUnlocked,
  onClearAll,
}: ActiveHuntPanelProps) {
  if (pinnedAchievements.length === 0) {
    return (
      <p className="flex items-center gap-2 rounded-xl border border-dashed border-slate-800 px-3.5 py-2.5 text-sm text-slate-400">
        <Target className="h-4 w-4 text-amber-400 shrink-0" />
        <span>
          Épingle jusqu&apos;à {MAX_PINNED_TARGETS} succès <Pin className="inline h-3.5 w-3.5 align-[-2px]" aria-label="épingle" /> pour les suivre ici.
        </span>
      </p>
    );
  }

  const hasUnlockedPinned = pinnedAchievements.some((a) => unlockedIds.includes(a.id));

  return (
    <section className="rounded-xl border border-amber-500/30 bg-amber-950/10 p-3.5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-amber-400" />
          <h2 className="text-sm font-semibold text-white">
            Chasse active
            <span className="ml-2 text-xs font-normal tabular-nums text-slate-400">
              {pinnedAchievements.length} / {MAX_PINNED_TARGETS}
            </span>
          </h2>
        </div>

        <div className="flex items-center gap-1.5">
          {hasUnlockedPinned && (
            <button
              type="button"
              onClick={onClearUnlocked}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-emerald-300 hover:bg-emerald-500/10"
            >
              <Sparkles className="h-3 w-3" /> Retirer obtenus
            </button>
          )}
          <button
            type="button"
            onClick={onClearAll}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <Trash2 className="h-3 w-3" /> Vider
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {pinnedAchievements.map((ach) => (
          <ActiveHuntTargetRow
            key={ach.id}
            achievement={ach}
            isUnlocked={unlockedIds.includes(ach.id)}
            note={notes[ach.id]}
            onToggleUnlocked={() => onToggleUnlocked(ach.id)}
            onUnpin={() => onUnpin(ach.id)}
          />
        ))}
      </div>
    </section>
  );
}
