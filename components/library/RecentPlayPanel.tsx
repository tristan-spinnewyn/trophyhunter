// components/library/RecentPlayPanel.tsx
"use client";

import type { PlaySession } from "@/lib/types";
import { playedTimeLabel, summarizeRecentPlay } from "@/lib/library/session-feed";

interface RecentPlayPanelProps {
  readonly sessions: readonly PlaySession[];
  readonly onSelectGame: (appId: number) => void;
}

/** What was played over the last seven days, game by game, from the sessions the syncs noticed. */
export function RecentPlayPanel({ sessions, onSelectGame }: RecentPlayPanelProps) {
  const summary = summarizeRecentPlay(sessions);
  if (summary.games.length === 0) return null;

  return (
    <section aria-labelledby="recent-play-title" className="rounded-control border border-edge bg-plank px-4 py-3">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h2 id="recent-play-title" className="font-semiwide text-sm font-bold text-paper">
          Cette semaine
        </h2>
        <p className="text-sm text-dust">{playedTimeLabel(summary.totalMinutes)} de jeu</p>
      </div>
      <ul className="divide-y divide-edge">
        {summary.games.map((game) => (
          <li key={`${game.platform}_${game.appId}`}>
            <button
              type="button"
              onClick={() => onSelectGame(game.appId)}
              className="flex w-full items-center justify-between gap-3 py-2 text-left text-sm transition hover:text-paper"
            >
              <span className="min-w-0 truncate font-semibold text-paper-dim">{game.name}</span>
              <span className="shrink-0 tabular-nums text-dust">{playedTimeLabel(game.minutes)}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
