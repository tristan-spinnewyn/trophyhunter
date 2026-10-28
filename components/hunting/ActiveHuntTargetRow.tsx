// components/hunting/ActiveHuntTargetRow.tsx
"use client";

import { Check, PinOff, AlertTriangle } from "lucide-react";
import type { Achievement } from "@/lib/types";

interface ActiveHuntTargetRowProps {
  readonly achievement: Achievement;
  readonly isUnlocked: boolean;
  readonly note?: string;
  readonly onToggleUnlocked: () => void;
  readonly onUnpin: () => void;
}

export function ActiveHuntTargetRow({
  achievement,
  isUnlocked,
  note,
  onToggleUnlocked,
  onUnpin,
}: ActiveHuntTargetRowProps) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border p-2.5 transition ${
        isUnlocked
          ? "border-emerald-500/40 bg-emerald-950/20"
          : "border-slate-800 bg-slate-950/70"
      }`}
    >
      <button
        type="button"
        onClick={onToggleUnlocked}
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition ${
          isUnlocked
            ? "border-emerald-500 bg-emerald-500 text-slate-950"
            : "border-slate-700 bg-slate-800 text-transparent hover:border-amber-400"
        }`}
        title={isUnlocked ? "Marquer non obtenu" : "Valider la cible"}
      >
        <Check className="h-4 w-4 stroke-[3]" />
      </button>

      <img
        src={achievement.icon}
        alt={achievement.name}
        className="h-10 w-10 rounded-lg object-cover border border-slate-800 shrink-0"
      />

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`text-xs sm:text-sm font-bold truncate ${
              isUnlocked ? "line-through text-emerald-300" : "text-white"
            }`}
          >
            {achievement.name}
          </span>
          <span className="text-[11px] font-semibold text-amber-300/90">
            {achievement.percent}%
          </span>
          {achievement.missable && (
            <span className="flex items-center gap-0.5 text-[11px] font-semibold text-amber-400">
              <AlertTriangle className="h-2.5 w-2.5" /> Manquable
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-300 line-clamp-2">{achievement.desc}</p>
        {note && <p className="mt-0.5 text-[11px] italic text-sky-300">📝 {note}</p>}
      </div>

      <button
        type="button"
        onClick={onUnpin}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-amber-300"
        title="Retirer de la chasse active"
      >
        <PinOff className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
