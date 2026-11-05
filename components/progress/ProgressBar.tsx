// components/progress/ProgressBar.tsx

import { CheckCircle2 } from "lucide-react";

interface ProgressBarProps {
  readonly total: number;
  readonly unlockedCount: number;
  readonly percent: number;
  readonly isComplete: boolean;
}

export function ProgressBar({ total, unlockedCount, percent, isComplete }: ProgressBarProps) {
  if (total <= 0) {
    return (
      <div className="mt-3 border-t border-edge pt-2.5 text-xs text-dust">
        Aucun succès répertorié pour ce jeu sur cette plateforme.
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label="Progression des succès"
        className="h-1.5 w-full overflow-hidden rounded-full bg-edge"
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            isComplete ? "bg-platinum" : "bg-platinum/80"
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-xs text-faint">
        <span>{total - unlockedCount} succès restants</span>
        {isComplete ? (
          <span className="font-medium text-platinum flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> Platine débloqué
          </span>
        ) : (
          <span>Objectif 100%</span>
        )}
      </div>
    </div>
  );
}
