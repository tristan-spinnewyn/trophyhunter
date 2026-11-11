// components/library/LibraryHeaderBanner.tsx

"use client";

import { Plus, Trophy } from "lucide-react";
import type { TrackingSummary } from "@/lib/library/library-tracking";
import { describeCollection, describePlatforms } from "@/lib/library/collection-sentence";
import { CONNECTABLE_PLATFORMS } from "@/lib/platforms";
import type { PlatformType } from "@/lib/types";

interface LibraryHeaderBannerProps {
  readonly ownedGamesCount: number;
  readonly onOpenAddGame: () => void;
  readonly trackingSummary: TrackingSummary;
  readonly isLoading?: boolean;
  /** The platforms the collection holds games on; the connectable ones when unknown. */
  readonly platforms?: readonly PlatformType[];
}

export function LibraryHeaderBanner({
  ownedGamesCount,
  onOpenAddGame,
  trackingSummary,
  isLoading = false,
  platforms = CONNECTABLE_PLATFORMS,
}: LibraryHeaderBannerProps) {
  const sentence = describeCollection(ownedGamesCount, trackingSummary);
  const { unlockedAchievements, perfectGames } = trackingSummary;
  const hasGames = !isLoading && ownedGamesCount > 0;

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <h1 className="font-wide text-[44px] font-extrabold leading-[0.92] tracking-[-0.035em] text-paper sm:text-7xl lg:text-8xl">
          Ma collection
        </h1>
        <button
          type="button"
          onClick={onOpenAddGame}
          className="mt-1 flex shrink-0 items-center gap-1.5 rounded-control bg-lamp px-3.5 py-2.5 text-sm font-bold text-ink transition hover:bg-lamp-bright"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>
            Ajouter<span className="hidden sm:inline"> un jeu</span>
          </span>
        </button>
      </div>

      {isLoading && <div className="h-5 w-72 animate-pulse rounded-control bg-plank" />}

      {hasGames && (
        <p className="max-w-[52ch] text-[17px] text-dust">
          <strong className="font-semibold text-paper">{sentence.size}</strong> sur {describePlatforms(platforms)}
          {sentence.hours && (
            <>
              , et <strong className="font-semibold text-paper">{sentence.hours}</strong> de jeu
            </>
          )}
          .{sentence.queue && ` ${sentence.queue.charAt(0).toUpperCase()}${sentence.queue.slice(1)}`}
        </p>
      )}

      {hasGames && unlockedAchievements > 0 && (
        <p className="flex items-center gap-1.5 text-sm text-dust">
          <Trophy className="h-3.5 w-3.5 text-platinum" aria-hidden />
          {unlockedAchievements} succès débloqués
          {perfectGames > 0 && `, dont ${perfectGames} ${perfectGames > 1 ? "jeux" : "jeu"} à 100 %`}
        </p>
      )}
    </section>
  );
}
