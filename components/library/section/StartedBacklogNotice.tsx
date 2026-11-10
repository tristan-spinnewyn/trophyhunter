// components/library/section/StartedBacklogNotice.tsx

import type { GameStatus, OwnedGame, PlatformType } from "@/lib/types";
import { findStartedBacklogGames } from "@/lib/library/started-backlog-games";
import { formatLastSession } from "@/lib/library/last-session";

interface StartedBacklogNoticeProps {
  readonly games: readonly OwnedGame[];
  readonly onUpdateGameStatus: (appId: number, platform: PlatformType, status: GameStatus) => Promise<void> | void;
  readonly now?: Date;
}

const BUTTON_CLASS =
  "rounded-control border border-seam px-3 py-1.5 text-sm font-semibold text-paper transition hover:bg-edge";

/**
 * Backlog games a sync found a session for: offers to move them to "in progress".
 * Keeping one in the backlog chooses the backlog again, which dates that choice after the session.
 */
export function StartedBacklogNotice({ games, onUpdateGameStatus, now }: StartedBacklogNoticeProps) {
  const started = findStartedBacklogGames(games);
  if (started.length === 0) return null;

  return (
    <section aria-label="Jeux du backlog lancés" className="rounded-control border border-edge bg-plank px-4 py-3">
      <p className="mb-2 flex items-center gap-2 text-sm text-dust">
        <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-queued" />
        Lancés depuis ton backlog
      </p>
      <ul className="divide-y divide-edge">
        {started.map((game) => (
          <li key={`${game.platform}_${game.appId}`} className="flex flex-wrap items-center gap-2 py-2">
            <p className="mr-auto min-w-0 text-sm text-paper-dim">
              <strong className="font-semibold text-paper">{game.name}</strong>
              <span className="text-dust">, joué {formatLastSession(game.lastPlayed, now)}</span>
            </p>
            <button
              type="button"
              className={BUTTON_CLASS}
              aria-label={`Passer ${game.name} en cours`}
              onClick={() => void onUpdateGameStatus(game.appId, game.platform, "in-progress")}
            >
              Passer en cours
            </button>
            <button
              type="button"
              className={`${BUTTON_CLASS} text-paper-dim`}
              aria-label={`Laisser ${game.name} au backlog`}
              onClick={() => void onUpdateGameStatus(game.appId, game.platform, "backlog")}
            >
              Laisser au backlog
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
