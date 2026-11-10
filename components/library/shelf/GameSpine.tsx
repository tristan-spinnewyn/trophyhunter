// components/library/shelf/GameSpine.tsx

import type { CSSProperties } from "react";
import type { OwnedGame } from "@/lib/types";
import { PLATFORM_META } from "@/lib/platforms";
import { getSpineStyle } from "@/lib/library/spine-style";

interface GameSpineProps {
  readonly game: OwnedGame;
  readonly onOpen: (game: OwnedGame) => void;
  /** 1-based place in the backlog queue, shown above the spine. */
  readonly queuePosition?: number;
}

/** A game stored spine-out: its title reads bottom to top, its store sits at the foot. */
export function GameSpine({ game, onOpen, queuePosition }: GameSpineProps) {
  const spine = getSpineStyle(game);
  const style = {
    "--spine-bg": spine.background,
    "--spine-fg": spine.foreground,
    "--spine-w": `${spine.widthPx}px`,
    "--spine-h": `${spine.heightPx}px`,
  } as CSSProperties;

  return (
    <div className="spine-slot">
      <button
        type="button"
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
        <span className="spine-platform" aria-hidden>
          {PLATFORM_META[game.platform]?.shortName}
        </span>
      </button>
    </div>
  );
}
