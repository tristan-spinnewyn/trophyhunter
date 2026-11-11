// components/library/tonight/TonightPickPanel.tsx
"use client";

import { useState } from "react";
import type { GameDurations, OwnedGame } from "@/lib/types";
import { TIME_BUDGETS, describePick, pickGamesForTonight, type TimeBudget } from "@/lib/library/tonight-pick";
import { resolveGameStatus } from "@/lib/game-status/game-status.services";
import { textTabClassName } from "@/components/ui/textTab";

const PICKS_SHOWN = 3;

interface TonightPickPanelProps {
  readonly games: readonly OwnedGame[];
  readonly durations: Readonly<Record<string, GameDurations>>;
  readonly onSelectGame: (appId: number) => void;
  /** Puts a backlog or paused game in progress. */
  readonly onStartGame: (game: OwnedGame) => void;
}

/** "Que jouer ce soir ?": three games for the time the owner has, a few more on demand. */
export function TonightPickPanel({ games, durations, onSelectGame, onStartGame }: TonightPickPanelProps) {
  const [budget, setBudget] = useState<TimeBudget>("evening");
  const [page, setPage] = useState(0);
  const picks = pickGamesForTonight(games, durations, budget);
  if (picks.length === 0) return null;

  const pageCount = Math.ceil(picks.length / PICKS_SHOWN);
  const shown = picks.slice((page % pageCount) * PICKS_SHOWN, (page % pageCount + 1) * PICKS_SHOWN);
  const chooseBudget = (value: TimeBudget) => {
    setBudget(value);
    setPage(0);
  };

  return (
    <section aria-labelledby="tonight-pick-title" className="rounded-control border border-edge bg-plank px-4 py-3">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="tonight-pick-title" className="font-semiwide text-sm font-bold text-paper">
          Que jouer ce soir ?
        </h2>
        <div role="tablist" aria-label="Temps devant toi" className="flex gap-4">
          {TIME_BUDGETS.map((b) => (
            <button
              key={b.value}
              type="button"
              role="tab"
              aria-selected={b.value === budget}
              onClick={() => chooseBudget(b.value)}
              className={textTabClassName(b.value === budget)}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      <ul aria-label="Idées pour ce soir" className="divide-y divide-edge">
        {shown.map((pick) => {
          const { game } = pick;
          const isPlaying = resolveGameStatus(game.status) === "in-progress";
          return (
            <li key={`${game.platform}_${game.appId}`} className="flex items-center justify-between gap-3 py-2">
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={() => onSelectGame(game.appId)}
                  className="block max-w-full truncate text-left text-sm font-semibold text-paper-dim transition hover:text-paper"
                >
                  {game.name}
                </button>
                <p className="text-sm text-dust">{describePick(pick)}</p>
              </div>
              {!isPlaying && (
                <button
                  type="button"
                  aria-label={`Commencer ${game.name}`}
                  onClick={() => onStartGame(game)}
                  className="shrink-0 rounded-control border border-edge px-3 py-1 text-sm text-paper-dim transition hover:border-seam hover:text-paper"
                >
                  Commencer
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {pageCount > 1 && (
        <button type="button" onClick={() => setPage((p) => p + 1)} className="mt-2 text-sm text-dust transition hover:text-paper">
          D&apos;autres idées
        </button>
      )}
    </section>
  );
}
