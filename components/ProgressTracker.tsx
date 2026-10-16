"use client";

import { useEffect, useRef } from "react";
import { Trophy, CheckCircle2, RotateCcw, Award, Flame, RefreshCw } from "lucide-react";
import confetti from "canvas-confetti";

interface ProgressTrackerProps {
  total: number;
  unlockedCount: number;
  onReset: () => void;
  onSync?: () => void;
  isSyncing?: boolean;
  hasSteamUser?: boolean;
}

export default function ProgressTracker({
  total,
  unlockedCount,
  onReset,
  onSync,
  isSyncing = false,
  hasSteamUser = false,
}: ProgressTrackerProps) {
  const percent = total > 0 ? Math.round((unlockedCount / total) * 100) : 0;
  const isComplete = total > 0 && unlockedCount === total;
  const prevCountRef = useRef(unlockedCount);

  // Trigger confetti when 100% is reached
  useEffect(() => {
    if (isComplete && prevCountRef.current < total) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#38bdf8", "#fbbf24", "#34d399", "#818cf8"],
      });
    }
    prevCountRef.current = unlockedCount;
  }, [isComplete, unlockedCount, total]);

  // Trophy status tier
  const getTier = () => {
    if (isComplete) return { name: "Platine Obtenu ! 🏆", color: "from-sky-400 to-indigo-400 text-sky-400 border-sky-500/50" };
    if (percent >= 75) return { name: "Rang Or 🥇", color: "from-amber-400 to-yellow-500 text-amber-400 border-amber-500/50" };
    if (percent >= 40) return { name: "Rang Argent 🥈", color: "from-slate-300 to-slate-400 text-slate-300 border-slate-500/50" };
    return { name: "Rang Bronze 🥉", color: "from-amber-600 to-amber-800 text-amber-600 border-amber-700/50" };
  };

  const tier = getTier();

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border p-4 sm:p-5 transition-all duration-500 ${
        isComplete
          ? "border-amber-500/60 bg-gradient-to-br from-amber-950/40 via-slate-900 to-sky-950/40 shadow-2xl shadow-amber-500/10"
          : "border-slate-800 bg-slate-900/90 shadow-lg"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Left: Trophy Badge & Tier */}
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
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Progression
              </span>
              <span className={`text-xs font-semibold ${tier.color}`}>
                {tier.name}
              </span>
            </div>
            <div className="text-2xl font-black text-white">
              {percent}%{" "}
              <span className="text-xs font-normal text-slate-400">
                ({unlockedCount} / {total})
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions (Sync & Reset) */}
        <div className="flex items-center gap-1.5">
          {onSync && (
            <button
              onClick={onSync}
              disabled={isSyncing}
              className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-medium transition ${
                hasSteamUser
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                  : "border-sky-500/40 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20"
              }`}
              title={
                hasSteamUser
                  ? "Synchroniser avec votre profil Steam"
                  : "Configurer votre profil Steam pour l'auto-sync"
              }
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin text-sky-400" : ""}`} />
              <span className="hidden sm:inline">
                {isSyncing ? "Sync..." : hasSteamUser ? "Auto-Sync" : "Lier profil"}
              </span>
            </button>
          )}

          {unlockedCount > 0 && (
            <button
              onClick={() => {
                if (
                  window.confirm(
                    "Réinitialiser tous les succès cochés pour ce jeu ?"
                  )
                ) {
                  onReset();
                }
              }}
              className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-800/40 px-2.5 py-1.5 text-xs text-slate-400 transition hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-400"
              title="Réinitialiser la checklist"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Réinitialiser</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
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
    </div>
  );
}
