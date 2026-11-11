// components/library/shelf/SortableBacklogSpines.tsx
"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { OwnedGame } from "@/lib/types";
import { queueAfterMove } from "@/lib/library/backlog-order";
import { GameSpine } from "./GameSpine";

interface SortableBacklogSpinesProps {
  /** The backlog shelf as shown, queued games first. */
  readonly games: readonly OwnedGame[];
  readonly queuePositions: ReadonlyMap<string, number>;
  readonly gameKey: (game: OwnedGame) => string;
  readonly onOpen: (game: OwnedGame) => void;
  /** Receives the new queue of the shelf, in order. */
  readonly onReorder: (queue: OwnedGame[]) => void;
}

const SCREEN_READER_INSTRUCTIONS =
  "Espace pour prendre ce jeu, flèches pour le déplacer dans la file, Espace pour le poser, Échap pour annuler.";

/** The backlog shelf, whose spines can be dragged (mouse, touch or keyboard) to set the queue. */
export function SortableBacklogSpines({ games, queuePositions, gameKey, onOpen, onReorder }: SortableBacklogSpinesProps) {
  const sensors = useSensors(
    // A short move or hold first, so a click or a scroll is never taken for a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const ids = games.map(gameKey);
  const nameOf = (id: string | number) => games.find((g) => gameKey(g) === id)?.name ?? "";
  const announcements: Announcements = {
    onDragStart: ({ active }) => `${nameOf(active.id)} pris.`,
    onDragOver: ({ active, over }) => (over ? `${nameOf(active.id)} à la place ${ids.indexOf(String(over.id)) + 1}.` : undefined),
    onDragEnd: ({ active, over }) => (over ? `${nameOf(active.id)} posé à la place ${ids.indexOf(String(over.id)) + 1}.` : undefined),
    onDragCancel: ({ active }) => `${nameOf(active.id)} remis à sa place.`,
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) return;
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from < 0 || to < 0 || from === to) return;
    onReorder(queueAfterMove(games, from, to));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      accessibility={{ announcements, screenReaderInstructions: { draggable: SCREEN_READER_INSTRUCTIONS } }}
    >
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <div className="spine-rows pb-2">
          {games.map((g, index) => (
            <SortableSpine key={gameKey(g)} id={gameKey(g)} index={index} game={g} onOpen={onOpen} queuePosition={queuePositions.get(gameKey(g))} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

interface SortableSpineProps {
  readonly id: string;
  readonly index: number;
  readonly game: OwnedGame;
  readonly onOpen: (game: OwnedGame) => void;
  readonly queuePosition?: number;
}

function SortableSpine({ id, index, game, onOpen, queuePosition }: SortableSpineProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <GameSpine
      game={game}
      onOpen={onOpen}
      queuePosition={queuePosition}
      slotRef={setNodeRef}
      slotProps={{
        "data-shelf-index": index,
        "data-dragging": isDragging ? "true" : undefined,
        className: "spine-slot-sortable",
        style: { transform: CSS.Translate.toString(transform), transition },
      }}
      buttonProps={{ ...attributes, ...listeners, "aria-roledescription": "livre déplaçable" }}
    />
  );
}
