// components/library/LibraryHeaderBanner.tsx

"use client";

import Link from "next/link";
import { Gamepad2, User, Plus } from "lucide-react";
import { LibraryGlobalStatsGrid } from "./LibraryGlobalStatsGrid";

interface LibraryHeaderBannerProps {
  ownedGamesCount: number;
  onOpenAddGame: () => void;
  globalStats?: {
    totalGamesOwned: number;
    trackedGamesCount: number;
    totalCompletedGames: number;
    totalAchievementsUnlocked: number;
    connectedCount: number;
    avgCompletion: number;
  };
}

export function LibraryHeaderBanner({
  ownedGamesCount,
  onOpenAddGame,
  globalStats,
}: LibraryHeaderBannerProps) {
  return (
    <div className="rounded-3xl border border-slate-800/90 bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 p-5 sm:p-6 shadow-xl space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-400 shrink-0 shadow-inner">
            <Gamepad2 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
              Ma Bibliothèque Multi-Plateforme
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              {ownedGamesCount} jeux suivis • Steam, Xbox, Epic Games & GOG
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/account"
            className="flex items-center gap-2 rounded-xl border border-purple-500/40 bg-purple-500/10 px-4 py-2.5 text-xs font-bold text-purple-300 hover:bg-purple-500/20 hover:border-purple-500/60 transition shadow-sm"
          >
            <User className="h-4 w-4 text-purple-400" />
            <span>Comptes & Plateformes</span>
          </Link>
          <button
            onClick={onOpenAddGame}
            className="flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-sky-500/20 hover:bg-sky-400 transition"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Ajouter un jeu</span>
          </button>
        </div>
      </div>

      {globalStats && (
        <LibraryGlobalStatsGrid
          ownedGamesCount={ownedGamesCount}
          globalStats={globalStats}
        />
      )}
    </div>
  );
}
