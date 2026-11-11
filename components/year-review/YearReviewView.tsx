// components/year-review/YearReviewView.tsx
"use client";

import { useId } from "react";
import { Ban, CheckCircle2, Clock, Trophy } from "lucide-react";
import type { OwnedGame } from "@/lib/types";
import type { YearReview } from "@/lib/library/year-review";
import { PLATFORM_META } from "@/lib/platforms";
import { playedTimeLabel } from "@/lib/library/session-feed";
import { MAX_RATING } from "@/lib/game-review/game-review";
import { StatTileGrid, type StatTile } from "@/components/stats/StatTileGrid";
import { CompletedYearShelves } from "@/components/library/shelf/CompletedYearShelves";

interface YearReviewViewProps {
  readonly review: YearReview;
  /** Years that can be reviewed, latest first. */
  readonly years: readonly number[];
  readonly onSelectYear: (year: number) => void;
  readonly onOpenGame: (appId: number) => void;
}

const gameKey = (g: OwnedGame) => `${g.platform}_${g.appId}`;

function isEmpty(review: YearReview): boolean {
  return review.finished.length === 0 && review.abandoned.length === 0 && review.hoursPlayed === 0;
}

function yearTiles(review: YearReview): StatTile[] {
  return [
    { label: "Terminés", value: review.finished.length, icon: CheckCircle2, iconClass: "text-done" },
    { label: "Abandonnés", value: review.abandoned.length, icon: Ban, iconClass: "text-dropped" },
    { label: "Heures jouées", value: review.hoursPlayed > 0 ? `${review.hoursPlayed} h` : "—", icon: Clock, iconClass: "text-paper-dim" },
    { label: "Jeux à 100 %", value: review.perfectCount, icon: Trophy, iconClass: "text-platinum" },
  ];
}

/** One calendar year of gaming: figures, the platform and game of the year, best ratings, finishes and abandons. */
export function YearReviewView({ review, years, onSelectYear, onOpenGame }: YearReviewViewProps) {
  const yearFieldId = useId();
  const { year, topPlatform, mostPlayed } = review;

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-wide text-[44px] font-extrabold leading-[0.92] tracking-[-0.035em] text-paper sm:text-7xl lg:text-8xl">
          Mon année <span className="text-lamp">{year}</span>
        </h1>
        <div className="flex items-center gap-2">
          <label htmlFor={yearFieldId} className="text-sm text-dust">
            Année
          </label>
          <select
            id={yearFieldId}
            value={year}
            onChange={(e) => onSelectYear(Number(e.target.value))}
            className="rounded-control border border-seam bg-plank px-3 py-1.5 text-sm text-paper outline-none focus:border-paper-dim"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </header>

      {isEmpty(review) ? (
        <p className="max-w-[52ch] text-[17px] text-dust">
          Rien de terminé ni de joué en {year} pour l&apos;instant. Synchronise tes comptes ou marque tes jeux terminés pour remplir cette page.
        </p>
      ) : (
        <>
          <div role="group" aria-label="Chiffres de l'année">
            <StatTileGrid tiles={yearTiles(review)} />
          </div>

          {(topPlatform || mostPlayed) && (
            <dl className="grid gap-3 sm:grid-cols-2">
              {topPlatform && (
                <div className="rounded-control border border-edge bg-plank px-4 py-3">
                  <dt className="text-xs text-dust">Plateforme de l&apos;année</dt>
                  <dd className="mt-1 text-lg font-semibold text-paper">
                    <span>{PLATFORM_META[topPlatform.platform].name}</span>
                    <span className="ml-2 text-sm font-normal text-dust">
                      {topPlatform.hours !== null ? `${topPlatform.hours} h` : "le plus de jeux terminés"}
                    </span>
                  </dd>
                </div>
              )}
              {mostPlayed && (
                <div className="rounded-control border border-edge bg-plank px-4 py-3">
                  <dt className="text-xs text-dust">Le plus joué</dt>
                  <dd className="mt-1 text-lg font-semibold text-paper">
                    <span>{mostPlayed.name}</span>
                    <span className="ml-2 text-sm font-normal text-dust">{playedTimeLabel(mostPlayed.minutes)}</span>
                  </dd>
                </div>
              )}
            </dl>
          )}

          {review.bestRated.length > 0 && <GameListSection title="Tes meilleures notes" games={review.bestRated} onOpenGame={onOpenGame} showRating />}

          {review.finished.length > 0 && (
            <section aria-label={`Terminés en ${year}`}>
              <CompletedYearShelves games={review.finished} onOpen={(g) => onOpenGame(g.appId)} gameKey={gameKey} />
            </section>
          )}

          {review.abandoned.length > 0 && (
            <GameListSection title={`Abandonnés en ${year}`} games={review.abandoned} onOpenGame={onOpenGame} />
          )}
        </>
      )}
    </div>
  );
}

interface GameListSectionProps {
  readonly title: string;
  readonly games: readonly OwnedGame[];
  readonly onOpenGame: (appId: number) => void;
  readonly showRating?: boolean;
}

function GameListSection({ title, games, onOpenGame, showRating = false }: GameListSectionProps) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="space-y-2">
      <h2 id={headingId} className="font-semiwide text-sm font-bold text-paper">
        {title}
      </h2>
      <ul className="divide-y divide-edge rounded-control border border-edge bg-plank px-4">
        {games.map((game) => (
          <li key={gameKey(game)}>
            <button
              type="button"
              onClick={() => onOpenGame(game.appId)}
              className="flex w-full items-center justify-between gap-3 py-2 text-left text-sm transition hover:text-paper"
            >
              <span className="min-w-0 truncate font-semibold text-paper-dim">{game.name}</span>
              {showRating && game.rating !== undefined && (
                <span className="shrink-0 tabular-nums text-dust">
                  {game.rating}/{MAX_RATING}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
