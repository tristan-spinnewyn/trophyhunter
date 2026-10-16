// components/progress/ProgressBar.tsx

import { CheckCircle2 } from "lucide-react";

interface ProgressBarProps {
  total: number;
  unlockedCount: number;
  percent: number;
  isComplete: boolean;
}

export function ProgressBar({ total, unlockedCount, percent, isComplete }: ProgressBarProps) {
  return (
    <div className="mt-4">
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-800/80 p-0.5">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            isComplete
              ? "bg-gradient-to-r from-amber-400 via-sky-400 to-emerald-400 shadow-md shadow-sky-400/30"
              : percent >= 75
              ? "bg-gradient-to-r from-amber-500 to-yellow-400"
              : "bg-gradient-to-r from-sky-500 to-cyan-400"
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-slate-400">
        <span>{total - unlockedCount} succès restants</span>
        {isComplete ? (
          <span className="font-semibold text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Platine Débloqué !
          </span>
        ) : (
          <span>Objectif 100%</span>
        )}
      </div>
    </div>
  );
}
