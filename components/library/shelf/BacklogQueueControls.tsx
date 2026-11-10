// components/library/shelf/BacklogQueueControls.tsx

interface BacklogQueueControlsProps {
  /** 1-based place in the queue, or undefined when the game is in the backlog without an order. */
  readonly position: number | undefined;
  readonly onPlayNext: () => void;
  readonly onRemoveFromQueue: () => void;
}

const BUTTON_CLASS =
  "rounded-control border border-seam px-3 py-1.5 text-sm font-semibold text-paper transition hover:bg-edge";

/** Where a backlog game stands in the "what do I play next" queue, and how to move it. */
export function BacklogQueueControls({ position, onPlayNext, onRemoveFromQueue }: BacklogQueueControlsProps) {
  const isQueued = position !== undefined;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-edge pb-4">
      <p className="mr-auto flex items-center gap-2 text-sm text-paper-dim">
        <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-queued" />
        <span>{isQueued ? `N° ${position} dans la file` : "Hors de la file"}</span>
      </p>
      {position !== 1 && (
        <button type="button" className={BUTTON_CLASS} onClick={onPlayNext}>
          Jouer ensuite
        </button>
      )}
      {isQueued && (
        <button type="button" className={BUTTON_CLASS} onClick={onRemoveFromQueue}>
          Retirer de la file
        </button>
      )}
    </div>
  );
}
