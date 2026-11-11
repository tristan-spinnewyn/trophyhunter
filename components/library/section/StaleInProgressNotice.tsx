// components/library/section/StaleInProgressNotice.tsx

import type { GameStatus, OwnedGame, PlatformType } from "@/lib/types";
import { findStaleInProgressGames, lastActivityAt } from "@/lib/library/stale-in-progress-games";
import { formatElapsed } from "@/lib/library/last-session";

interface StaleInProgressNoticeProps {
  readonly games: readonly OwnedGame[];
  readonly staleAfterWeeks: number;
  readonly onUpdateGameStatus: (appId: number, platform: PlatformType, status: GameStatus) => Promise<void> | void;
  readonly now?: Date;
}

const BUTTON_CLASS =
  "rounded-control border border-seam px-3 py-1.5 text-sm font-semibold text-paper transition hover:bg-edge";

/**
 * In-progress games left aside for weeks: offers to pause them, so "En cours" stays what is really played.
 * Keeping one in progress chooses that status again, which silences the reminder for another stretch.
 */
export function StaleInProgressNotice({ games, staleAfterWeeks, onUpdateGameStatus, now = new Date() }: StaleInProgressNoticeProps) {
  const stale = findStaleInProgressGames(games, staleAfterWeeks, now);
  if (stale.length === 0) return null;

  return (
    <section aria-label="Jeux en cours délaissés" className="rounded-control border border-edge bg-plank px-4 py-3">
      <p className="mb-2 flex items-center gap-2 text-sm text-dust">
        <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-paused" />
        En cours, mais délaissés
      </p>
      <ul className="divide-y divide-edge">
        {stale.map((game) => (
          <li key={`${game.platform}_${game.appId}`} className="flex flex-wrap items-center gap-2 py-2">
            <p className="mr-auto min-w-0 text-sm text-paper-dim">
              <strong className="font-semibold text-paper">{game.name}</strong>
              <span className="text-dust">, rien depuis {formatElapsed(lastActivityAt(game), now)}</span>
            </p>
            <button
              type="button"
              className={BUTTON_CLASS}
              aria-label={`Mettre ${game.name} en pause`}
              onClick={() => void onUpdateGameStatus(game.appId, game.platform, "paused")}
            >
              Mettre en pause
            </button>
            <button
              type="button"
              className={`${BUTTON_CLASS} text-paper-dim`}
              aria-label={`Garder ${game.name} en cours`}
              onClick={() => void onUpdateGameStatus(game.appId, game.platform, "in-progress")}
            >
              Toujours en cours
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
