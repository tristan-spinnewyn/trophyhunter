// components/library/shelf/GameSpine.tsx

import type { ButtonHTMLAttributes, CSSProperties, HTMLAttributes, Ref } from "react";
import type { OwnedGame } from "@/lib/types";
import { PLATFORM_META } from "@/lib/platforms";
import { getSpineStyle } from "@/lib/library/spine-style";

type DataAttributes = { readonly [key: `data-${string}`]: string | number | undefined };

interface GameSpineProps {
  readonly game: OwnedGame;
  readonly onOpen: (game: OwnedGame) => void;
  /** 1-based place in the backlog queue, shown above the spine. */
  readonly queuePosition?: number;
  /** How long the game takes to beat ("12 h"), shown at the foot of the spine. */
  readonly durationLabel?: string | null;
  /** Lets a shelf move the spine around, as when the backlog queue is dragged into a new order. */
  readonly slotRef?: Ref<HTMLDivElement>;
  readonly slotProps?: HTMLAttributes<HTMLDivElement> & DataAttributes;
  readonly buttonProps?: ButtonHTMLAttributes<HTMLButtonElement>;
}

/** A game stored spine-out: its title reads bottom to top, its store sits at the foot. */
export function GameSpine({ game, onOpen, queuePosition, durationLabel, slotRef, slotProps, buttonProps }: GameSpineProps) {
  const spine = getSpineStyle(game);
  const style = {
    "--spine-bg": spine.background,
    "--spine-fg": spine.foreground,
    "--spine-w": `${spine.widthPx}px`,
    "--spine-h": `${spine.heightPx}px`,
  } as CSSProperties;

  return (
    <div ref={slotRef} {...slotProps} className={`spine-slot ${slotProps?.className ?? ""}`.trim()}>
      <button
        type="button"
        {...buttonProps}
        className="spine"
        style={style}
        aria-label={game.name}
        title={game.name}
        data-queue-position={queuePosition}
        onClick={() => onOpen(game)}
      >
        {queuePosition !== undefined && (
          <span className="spine-rank" aria-hidden>
            {queuePosition}
          </span>
        )}
        <span className="spine-title" aria-hidden>
          {game.name}
        </span>
        {durationLabel && (
          <span className="spine-duration" aria-hidden>
            {durationLabel}
          </span>
        )}
        <span className="spine-platform" aria-hidden>
          {PLATFORM_META[game.platform]?.shortName}
        </span>
      </button>
    </div>
  );
}
