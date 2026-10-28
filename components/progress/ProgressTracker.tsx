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
      className={`relative overflow-hidden rounded-2xl border p-4 transition-colors ${
        isComplete ? "border-amber-500/50 bg-amber-950/20" : "border-slate-800 bg-slate-900/60"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl ${
              isComplete ? "bg-amber-400/15 text-amber-400" : "bg-slate-800 text-slate-300"
            }`}
          >
            {isComplete ? (
              <Trophy className="h-5 w-5 fill-amber-400" />
            ) : (
              <Award className="h-5 w-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Succès</span>
              <span className={`text-xs font-medium ${tier.color}`}>{tier.name}</span>
            </div>
            {hasAchievements ? (
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-semibold tabular-nums text-white">{percent}%</span>
                <span className="text-xs tabular-nums text-slate-500">{unlockedCount} / {total}</span>
              </div>
            ) : (
              <div className="text-lg font-medium text-slate-300">
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
        <p className="mt-3 text-xs text-slate-400">
          Ta plateforme indique {untrackedCount} succès débloqués. Synchronise pour cocher le détail.
        </p>
      )}
    </div>
  );
}
