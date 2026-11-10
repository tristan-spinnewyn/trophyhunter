// components/library/triage/TriageDialog.tsx

"use client";

import type { GameStatus, OwnedGame, PlatformType } from "@/lib/types";
import { GAME_STATUS_META } from "@/lib/game-status/game-status.services";
import { suggestGameStatus } from "@/lib/library/status-suggestion";
import { Modal } from "@/components/ui/Modal";
import { TriageDestinationButtons } from "./TriageDestinationButtons";
import { TriageGameSheet } from "./TriageGameSheet";
import { describeTriageSession } from "./triageSummary";
import { useTriageQueue } from "./useTriageQueue";
import { useTriageShortcuts } from "./useTriageShortcuts";

interface TriageDialogProps {
  /** The unsorted games when sorting starts; later changes to this list are ignored. */
  readonly games: readonly OwnedGame[];
  readonly onSetStatus: (appId: number, platform: PlatformType, status: GameStatus) => Promise<void> | void;
  readonly onClose: () => void;
  readonly now?: Date;
}

/** Quick sorting: the unsorted pile one game at a time, one key or tap per shelf. */
export function TriageDialog({ games, onSetStatus, onClose, now }: TriageDialogProps) {
  const queue = useTriageQueue(games);
  const game = queue.current;
  const suggestion = game ? suggestGameStatus(game, now) : null;

  const choose = (status: GameStatus) => {
    if (!game) return;
    void onSetStatus(game.appId, game.platform, status);
    queue.markSorted();
  };

  useTriageShortcuts({
    isActive: Boolean(game),
    suggestedStatus: suggestion?.status ?? null,
    onChoose: choose,
    onSkip: queue.skip,
  });

  return (
    <Modal title="Trier mes jeux" onClose={onClose} size="md">
      {game ? (
        <div className="space-y-5">
          <p className="tabular-nums text-sm text-dust">
            {queue.position} / {queue.total}
          </p>
          <TriageGameSheet game={game} now={now} />
          <p className="min-h-5 text-sm text-paper-dim">
            {suggestion && (
              <>
                <span className="text-dust">Suggestion : </span>
                <span className="font-semibold text-paper">{GAME_STATUS_META[suggestion.status].label}</span>
                <span className="text-dust"> · </span>
                <span>{suggestion.reason}</span>
                <span className="text-dust"> (Entrée pour accepter)</span>
              </>
            )}
          </p>
          <TriageDestinationButtons
            gameKey={`${game.platform}_${game.appId}`}
            suggestedStatus={suggestion?.status ?? null}
            onChoose={choose}
            onSkip={queue.skip}
          />
        </div>
      ) : (
        <div className="space-y-4 py-4 text-center">
          <p className="text-paper">{describeTriageSession(queue.sortedCount, queue.skippedCount)}</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-control border border-seam px-4 py-2 text-sm font-semibold text-paper hover:bg-edge"
          >
            Terminer
          </button>
        </div>
      )}
    </Modal>
  );
}
