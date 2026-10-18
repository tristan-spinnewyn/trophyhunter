// components/hunting/ActiveHuntPanel.tsx
"use client";

import { Target, Trash2, Sparkles } from "lucide-react";
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
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800/90 bg-slate-900/50 px-4 py-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-amber-400 shrink-0" />
          <span>
            <strong className="text-slate-200">Mode Chasse Active :</strong> Épingle jusqu&apos;à {MAX_PINNED_TARGETS} succès cibles pour les garder sous les yeux pendant ta session.
          </span>
        </div>
      </div>
    );
  }

  const hasUnlockedPinned = pinnedAchievements.some((a) => unlockedIds.includes(a.id));

  return (
    <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-950/25 via-slate-900/95 to-slate-900 p-4 shadow-lg space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Target className="h-4 w-4" />
          </span>
          <h3 className="text-sm font-black tracking-tight text-white flex items-center gap-2">
            Chasse Active
            <span className="rounded-lg bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[11px] font-bold text-amber-300">
              {pinnedAchievements.length} / {MAX_PINNED_TARGETS} cibles
            </span>
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          {hasUnlockedPinned && (
            <button
              type="button"
              onClick={onClearUnlocked}
              className="flex items-center gap-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/20"
            >
              <Sparkles className="h-3 w-3" /> Retirer obtenus
            </button>
          )}
          <button
            type="button"
            onClick={onClearAll}
            className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-700 hover:text-white"
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
    </div>
  );
}
