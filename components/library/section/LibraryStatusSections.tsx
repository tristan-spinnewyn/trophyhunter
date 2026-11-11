// components/library/section/LibraryStatusSections.tsx

"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import type { GameStatus, OwnedGame, PlatformType } from "@/lib/types";
import { groupGamesByStatus, type StatusSection } from "@/lib/library/library-tracking";
import { GAME_STATUS_META, resolveGameStatus } from "@/lib/game-status/game-status.services";
import { getQueuePositions } from "@/lib/library/backlog-order";
import { GameSpine } from "@/components/library/shelf/GameSpine";
import { ShelfHeading } from "@/components/library/shelf/ShelfHeading";
import { GamePeekDialog } from "@/components/library/shelf/GamePeekDialog";
import { BacklogQueueControls } from "@/components/library/shelf/BacklogQueueControls";
import { CompletedYearShelves } from "@/components/library/shelf/CompletedYearShelves";
import { SortableBacklogSpines } from "@/components/library/shelf/SortableBacklogSpines";
import { TriageDialog } from "@/components/library/triage/TriageDialog";

interface LibraryStatusSectionsProps {
  readonly games: OwnedGame[];
  readonly renderGame: (game: OwnedGame) => ReactNode;
  /** Enables quick sorting of the unsorted shelf. */
  readonly onUpdateGameStatus?: (appId: number, platform: PlatformType, status: GameStatus) => Promise<void> | void;
  /** Together, these enable ordering the backlog as a queue. */
  readonly onPlayNext?: (appId: number, platform: PlatformType) => Promise<void> | void;
  readonly onRemoveFromQueue?: (appId: number, platform: PlatformType) => Promise<void> | void;
  /** Enables dragging the backlog spines; receives the shelf as shown and its new queue. */
  readonly onReorderQueue?: (visibleShelf: OwnedGame[], visibleQueue: OwnedGame[]) => Promise<void> | void;
}

const gameKey = (g: OwnedGame) => `${g.platform}_${g.appId}`;

/** The collection as a bookcase: games being played face-out on a lit shelf, the rest spine-out. */
export function LibraryStatusSections({
  games,
  renderGame,
  onUpdateGameStatus,
  onPlayNext,
  onRemoveFromQueue,
  onReorderQueue,
}: LibraryStatusSectionsProps) {
  const [peekedKey, setPeekedKey] = useState<string | null>(null);
  const [isSorting, setIsSorting] = useState(false);
  const sections = groupGamesByStatus(games);
  const queuePositions = getQueuePositions(sections.find((s) => s.status === "backlog")?.games ?? []);
  const canOrderBacklog = Boolean(onPlayNext && onRemoveFromQueue);
  // Looked up on every render so the dialog follows the game when its status changes.
  const peeked = peekedKey ? games.find((g) => gameKey(g) === peekedKey) : undefined;

  return (
    <div className="space-y-12">
      {sections.map((section) =>
        section.status === "in-progress" ? (
          <FaceOutShelf key={section.status} section={section} renderGame={renderGame} />
        ) : (
          <SpineShelf
            key={section.status}
            section={section}
            queuePositions={section.status === "backlog" ? queuePositions : undefined}
            onOpen={(g) => setPeekedKey(gameKey(g))}
            onSort={section.status === "unsorted" && onUpdateGameStatus ? () => setIsSorting(true) : undefined}
            onReorder={
              section.status === "backlog" && onReorderQueue
                ? (queue) => void onReorderQueue(section.games, queue)
                : undefined
            }
          />
        )
      )}

      {isSorting && onUpdateGameStatus && (
        <TriageDialog
          games={sections.find((s) => s.status === "unsorted")?.games ?? []}
          onSetStatus={onUpdateGameStatus}
          onClose={() => setIsSorting(false)}
        />
      )}

      {peeked && (
        <GamePeekDialog title={peeked.name} onClose={() => setPeekedKey(null)}>
          {canOrderBacklog && resolveGameStatus(peeked.status) === "backlog" && (
            <BacklogQueueControls
              position={queuePositions.get(gameKey(peeked))}
              onPlayNext={() => void onPlayNext?.(peeked.appId, peeked.platform)}
              onRemoveFromQueue={() => void onRemoveFromQueue?.(peeked.appId, peeked.platform)}
            />
          )}
          {renderGame(peeked)}
        </GamePeekDialog>
      )}
    </div>
  );
}

function FaceOutShelf({ section, renderGame }: { readonly section: StatusSection; readonly renderGame: (g: OwnedGame) => ReactNode }) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId}>
      <div className="mb-5">
        <ShelfHeading id={headingId} title={section.title} count={section.games.length} />
      </div>
      <div className="-mx-4 grid auto-cols-[62%] grid-flow-col gap-4 overflow-x-auto scrollbar-none snap-x snap-mandatory px-4 sm:mx-0 sm:auto-cols-auto sm:grid-flow-row sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] sm:gap-7 sm:overflow-visible sm:px-0 items-end">
        {section.games.map((g) => (
          <div key={gameKey(g)} className="snap-start">
            {renderGame(g)}
          </div>
        ))}
      </div>
      <div className="shelf-board shelf-board-lit" aria-hidden />
    </section>
  );
}

interface SpineShelfProps {
  readonly section: StatusSection;
  readonly onOpen: (g: OwnedGame) => void;
  /** Places in the backlog queue, keyed like `gameKey`. */
  readonly queuePositions?: ReadonlyMap<string, number>;
  /** Shows a "sort" action in the shelf heading. */
  readonly onSort?: () => void;
  /** Makes the spines draggable; receives the new queue of the shelf. */
  readonly onReorder?: (queue: OwnedGame[]) => void;
}

function SpineShelf({ section, onOpen, queuePositions, onSort, onReorder }: SpineShelfProps) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId}>
      <details open={section.isOpenByDefault} className="group border-t border-edge">
        <summary className="flex cursor-pointer list-none items-center gap-3 py-4 [&::-webkit-details-marker]:hidden">
          <ShelfHeading
            id={headingId}
            title={section.title}
            count={section.games.length}
            dotClass={GAME_STATUS_META[section.status].dotClass}
            size={section.isOpenByDefault ? "large" : "small"}
          />
          {onSort && (
            <button
              type="button"
              onClick={(e) => {
                // Inside <summary>: sorting must not fold or unfold the shelf.
                e.preventDefault();
                onSort();
              }}
              className="ml-auto rounded-control border border-seam px-3 py-1.5 text-sm font-semibold text-paper hover:bg-edge"
            >
              Trier
            </button>
          )}
          <ChevronRight aria-hidden className={`h-4 w-4 text-dust transition group-open:rotate-90 ${onSort ? "" : "ml-auto"}`} />
        </summary>
        <SpineShelfContent section={section} onOpen={onOpen} queuePositions={queuePositions} onReorder={onReorder} />
      </details>
    </section>
  );
}

/** Spines laid out by year for finished games, draggable for an orderable backlog, plain otherwise. */
function SpineShelfContent({ section, onOpen, queuePositions, onReorder }: Omit<SpineShelfProps, "onSort">) {
  if (section.status === "completed") {
    return <CompletedYearShelves games={section.games} onOpen={onOpen} gameKey={gameKey} />;
  }
  if (onReorder) {
    return (
      <SortableBacklogSpines
        games={section.games}
        queuePositions={queuePositions ?? new Map()}
        gameKey={gameKey}
        onOpen={onOpen}
        onReorder={onReorder}
      />
    );
  }
  return (
    <div className="spine-rows pb-2">
      {section.games.map((g) => (
        <GameSpine key={gameKey(g)} game={g} onOpen={onOpen} queuePosition={queuePositions?.get(gameKey(g))} />
      ))}
    </div>
  );
}
