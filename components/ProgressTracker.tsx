// components/ProgressTracker.tsx
"use client";

import { useEffect, useRef } from "react";
import { Trophy, Award } from "lucide-react";
import type { ProgressTrackerProps } from "./progress/ProgressTracker.types";
import { fireCompletionConfetti, getProgressTier } from "./progress/progressTier";
import { ProgressTrackerActions } from "./progress/ProgressTrackerActions";
import { ProgressBar } from "./progress/ProgressBar";

export default function ProgressTracker({
  total,
  unlockedCount,
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

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border p-4 sm:p-5 transition-all duration-500 ${
        isComplete
          ? "border-amber-500/60 bg-gradient-to-br from-amber-950/40 via-slate-900 to-sky-950/40 shadow-2xl shadow-amber-500/10"
          : "border-slate-800 bg-slate-900/90 shadow-lg"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl border bg-gradient-to-br shadow-inner ${
              isComplete
                ? "border-amber-400/50 from-amber-400/20 to-amber-600/30 text-amber-400 animate-pulse"
                : "border-slate-700 from-slate-800 to-slate-950 text-slate-300"
            }`}
          >
            {isComplete ? (
              <Trophy className="h-6 w-6 fill-amber-400 stroke-amber-400" />
            ) : (
              <Award className="h-6 w-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Progression</span>
              <span className={`text-xs font-semibold ${tier.color}`}>{tier.name}</span>
            </div>
            {hasAchievements ? (
              <div className="text-2xl font-black text-white">
                {percent}%{" "}
                <span className="text-xs font-normal text-slate-400">({unlockedCount} / {total})</span>
              </div>
            ) : (
              <div className="text-lg font-bold text-slate-300">
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
    </div>
  );
}
