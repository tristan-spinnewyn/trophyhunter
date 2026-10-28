// components/library/LibraryHeaderBanner.tsx

"use client";

import { Plus } from "lucide-react";
import type { TrackingSummary } from "@/lib/library/library-tracking";
import { TrackingSummaryTiles } from "./TrackingSummaryTiles";

interface LibraryHeaderBannerProps {
  readonly ownedGamesCount: number;
  readonly onOpenAddGame: () => void;
  readonly trackingSummary: TrackingSummary;
  readonly isLoading?: boolean;
}

export function LibraryHeaderBanner({
  ownedGamesCount,
  onOpenAddGame,
  trackingSummary,
  isLoading = false,
}: LibraryHeaderBannerProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
            Ma collection
          </h1>
          {isLoading ? (
            <div className="mt-2 h-4 w-48 animate-pulse rounded bg-slate-800" />
          ) : (
            <p className="mt-1 text-sm text-slate-400">
              {ownedGamesCount} {ownedGamesCount > 1 ? "jeux" : "jeu"} sur Steam, Xbox, Epic Games et GOG
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onOpenAddGame}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-sky-500 px-3.5 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-400 transition"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>Ajouter<span className="hidden sm:inline"> un jeu</span></span>
        </button>
      </div>

      {ownedGamesCount > 0 && <TrackingSummaryTiles summary={trackingSummary} />}
    </section>
  );
}
