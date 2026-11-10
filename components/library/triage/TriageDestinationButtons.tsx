// components/library/triage/TriageDestinationButtons.tsx

import { useEffect, useRef } from "react";
import type { GameStatus } from "@/lib/types";
import { GAME_STATUS_META } from "@/lib/game-status/game-status.services";
import { TRIAGE_DESTINATIONS, TRIAGE_SKIP_SHORTCUT } from "./triageDestinations";

interface TriageDestinationButtonsProps {
  /** Identifies the game being sorted; the focus is placed again whenever it changes. */
  readonly gameKey: string;
  readonly suggestedStatus: GameStatus | null;
  readonly onChoose: (status: GameStatus) => void;
  readonly onSkip: () => void;
}

const BUTTON_CLASS =
  "flex items-center gap-2 rounded-control border px-3 py-2.5 text-sm font-semibold transition hover:border-seam hover:text-paper";

function Shortcut({ letter }: { readonly letter: string }) {
  return (
    <kbd aria-hidden className="ml-auto rounded-object border border-seam px-1.5 text-[11px] font-medium uppercase text-dust">
      {letter}
    </kbd>
  );
}

/** One button per shelf the game can go to, each in its shelf colour, plus "skip". */
export function TriageDestinationButtons({ gameKey, suggestedStatus, onChoose, onSkip }: TriageDestinationButtonsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Enter clicks the focused button. Leaving the focus on the previous choice would apply it to
  // the next game, so each game starts on its suggestion, or on "skip" when there is none.
  useEffect(() => {
    const container = containerRef.current;
    const target =
      container?.querySelector<HTMLButtonElement>('[data-suggested="true"]') ??
      container?.querySelector<HTMLButtonElement>("[data-skip]");
    target?.focus();
  }, [gameKey]);

  return (
    <div ref={containerRef} className="space-y-2">
      <div role="group" aria-label="Ranger ce jeu" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {TRIAGE_DESTINATIONS.map(({ status, shortcut }) => {
          const meta = GAME_STATUS_META[status];
          const isSuggested = status === suggestedStatus;
          return (
            <button
              key={status}
              type="button"
              data-status={status}
              data-suggested={isSuggested}
              aria-keyshortcuts={shortcut}
              onClick={() => onChoose(status)}
              className={`${BUTTON_CLASS} ${isSuggested ? "border-paper bg-edge text-paper" : "border-edge text-paper-dim"}`}
            >
              <span aria-hidden className={`h-2.5 w-2.5 shrink-0 rounded-full ${meta.dotClass}`} />
              {meta.label}
              <Shortcut letter={shortcut} />
            </button>
          );
        })}
      </div>
      <button
        type="button"
        data-skip
        aria-keyshortcuts={TRIAGE_SKIP_SHORTCUT}
        onClick={onSkip}
        className={`${BUTTON_CLASS} w-full border-dashed border-edge text-dust`}
      >
        Passer
        <Shortcut letter={TRIAGE_SKIP_SHORTCUT} />
      </button>
    </div>
  );
}
