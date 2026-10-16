// components/achievement/AchievementItemHeader.tsx
"use client";

import { Check, AlertTriangle, Eye, Edit3 } from "lucide-react";
import type { Achievement } from "@/lib/types";
import type { RarityBadge } from "./AchievementItem.types";

interface HeaderProps {
  achievement: Achievement;
  isUnlocked: boolean;
  notes: string;
  rarity: RarityBadge;
  descriptionText: string;
  onToggleUnlocked: () => void;
  onToggleExpand: () => void;
}

export function AchievementItemHeader({
  achievement,
  isUnlocked,
  notes,
  rarity,
  descriptionText,
  onToggleUnlocked,
  onToggleExpand,
}: HeaderProps) {
  return (
    <div className="flex items-center gap-3 p-3 sm:p-4">
      <button
        onClick={onToggleUnlocked}
        title={isUnlocked ? "Marquer comme non obtenu" : "Marquer comme obtenu"}
        className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl border transition active:scale-90 ${
          isUnlocked
            ? "border-emerald-500 bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30"
            : "border-slate-700 bg-slate-800/80 text-transparent hover:border-slate-600 hover:text-slate-500"
        }`}
      >
        <Check className="h-4 w-4 sm:h-5 sm:w-5 stroke-[3]" />
      </button>

      <div className="relative shrink-0">
        <img
          src={achievement.icon}
          alt={achievement.name}
          className={`h-12 w-12 sm:h-14 sm:w-14 rounded-xl object-cover border transition ${
            isUnlocked ? "border-emerald-500/60 shadow-md shadow-emerald-500/10" : "border-slate-800 grayscale-[40%] opacity-80"
          }`}
          onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
        />
        {isUnlocked && (
          <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-slate-950 font-bold">
            ✓
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 cursor-pointer" onClick={onToggleExpand}>
        <div className="flex flex-wrap items-center gap-1.5">
          <h3 className={`text-sm sm:text-base font-bold tracking-tight ${isUnlocked ? "text-emerald-300" : "text-white"}`}>
            {achievement.name}
          </h3>
          <span className={`rounded-md border px-1.5 py-0.2 text-[10px] font-semibold ${rarity.classes}`}>
            {achievement.percent}% • {rarity.label}
          </span>
          {achievement.missable && (
            <span className="flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.2 text-[10px] font-semibold text-amber-300">
              <AlertTriangle className="h-2.5 w-2.5" /> Manquable
            </span>
          )}
          {achievement.hidden && (
            <span className="flex items-center gap-1 rounded-md border border-purple-500/40 bg-purple-500/10 px-1.5 py-0.2 text-[10px] font-semibold text-purple-300">
              <Eye className="h-2.5 w-2.5" /> Secret
            </span>
          )}
          {notes && (
            <span className="flex items-center gap-1 rounded-md border border-sky-500/40 bg-sky-500/10 px-1.5 py-0.2 text-[10px] font-semibold text-sky-300">
              <Edit3 className="h-2.5 w-2.5" /> Note
            </span>
          )}
        </div>
        <p className="mt-1 text-xs leading-relaxed text-slate-300">
          {descriptionText}
        </p>
      </div>
    </div>
  );
}
