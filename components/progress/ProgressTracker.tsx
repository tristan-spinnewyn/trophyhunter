// components/progress/ProgressTracker.tsx
"use client";

import { useEffect, useRef } from "react";
import { Trophy, Award } from "lucide-react";
import type { ProgressTrackerProps } from "./ProgressTracker.types";
import { fireCompletionConfetti, getProgressTier, getUntrackedUnlockedCount } from "./progressTier";
import { ProgressTrackerActions } from "./ProgressTrackerActions";
import { ProgressBar } from "./ProgressBar";

export default function ProgressTracker({
  total,
  unlockedCount,
  importedUnlockedCount,
  onReset,
  onSync,
  isSyncing = false,
  hasSteamUser = false,
  platform = "steam",
  platformConnected,
  onOpenEpicModal,
}: ProgressTrackerProps) {
  const hasAchievements = total > 0;
  const percent = hasAchievements ? Math.round((unlockedCount / total) * 100) : 0;
  const isComplete = hasAchievements && unlockedCount === total;
  const prevCountRef = useRef(unlockedCount);

  useEffect(() => {
    if (isComplete && prevCountRef.current < total) {
      fireCompletionConfetti();
    }
    prevCountRef.current = unlockedCount;
  }, [isComplete, unlockedCount, total]);

  const tier = getProgressTier(isComplete, percent, total);
  const untrackedCount = getUntrackedUnlockedCount(unlockedCount, importedUnlockedCount);

  return (
    <div
      className={`relative overflow-hidden rounded-sheet border p-4 transition-colors ${
        isComplete ? "border-platinum/50 bg-plank" : "border-edge bg-plank/60"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-control ${
              isComplete ? "bg-platinum/15 text-platinum" : "bg-edge text-paper-dim"
            }`}
          >
            {isComplete ? (
              <Trophy className="h-5 w-5 fill-platinum" />
            ) : (
              <Award className="h-5 w-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-dust">Succès</span>
              <span className={`text-xs font-medium ${tier.color}`}>{tier.name}</span>
            </div>
            {hasAchievements ? (
              <div className="flex items-baseline gap-1.5">
                <span className="font-semiwide text-2xl font-bold tabular-nums text-paper">{percent}%</span>
                <span className="text-xs tabular-nums text-faint">{unlockedCount} / {total}</span>
              </div>
            ) : (
              <div className="text-lg font-medium text-paper-dim">
                Aucun succès
              </div>
            )}
          </div>
        </div>

        <ProgressTrackerActions
          unlockedCount={unlockedCount}
          onReset={onReset}
          onSync={onSync}
          isSyncing={isSyncing}
          hasSteamUser={hasSteamUser}
          platform={platform}
          platformConnected={platformConnected}
          onOpenEpicModal={onOpenEpicModal}
        />
      </div>

      <ProgressBar total={total} unlockedCount={unlockedCount} percent={percent} isComplete={isComplete} />

      {untrackedCount !== null && (
        <p className="mt-3 text-xs text-dust">
          Ta plateforme indique {untrackedCount} succès débloqués. Synchronise pour cocher le détail.
        </p>
      )}
    </div>
  );
}
