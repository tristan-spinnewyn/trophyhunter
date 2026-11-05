// components/library/section/LibraryStatusSections.tsx

"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import type { OwnedGame } from "@/lib/types";
import { groupGamesByStatus, type StatusSection } from "@/lib/library/library-tracking";
import { GAME_STATUS_META } from "@/lib/game-status/game-status.services";
import { GameSpine } from "@/components/library/shelf/GameSpine";
import { ShelfHeading } from "@/components/library/shelf/ShelfHeading";
import { GamePeekDialog } from "@/components/library/shelf/GamePeekDialog";

interface LibraryStatusSectionsProps {
  readonly games: OwnedGame[];
  readonly renderGame: (game: OwnedGame) => ReactNode;
}

const gameKey = (g: OwnedGame) => `${g.platform}_${g.appId}`;

/** The collection as a bookcase: games being played face-out on a lit shelf, the rest spine-out. */
export function LibraryStatusSections({ games, renderGame }: LibraryStatusSectionsProps) {
  const [peekedKey, setPeekedKey] = useState<string | null>(null);
  // Looked up on every render so the dialog follows the game when its status changes.
  const peeked = peekedKey ? games.find((g) => gameKey(g) === peekedKey) : undefined;

  return (
    <div className="space-y-12">
      {groupGamesByStatus(games).map((section) =>
        section.status === "in-progress" ? (
          <FaceOutShelf key={section.status} section={section} renderGame={renderGame} />
        ) : (
          <SpineShelf key={section.status} section={section} onOpen={(g) => setPeekedKey(gameKey(g))} />
        )
      )}

      {peeked && (
        <GamePeekDialog title={peeked.name} onClose={() => setPeekedKey(null)}>
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

function SpineShelf({ section, onOpen }: { readonly section: StatusSection; readonly onOpen: (g: OwnedGame) => void }) {
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
          <ChevronRight aria-hidden className="ml-auto h-4 w-4 text-dust transition group-open:rotate-90" />
        </summary>
        <div className="spine-rows pb-2">
          {section.games.map((g) => (
            <GameSpine key={gameKey(g)} game={g} onOpen={onOpen} />
          ))}
        </div>
      </details>
    </section>
  );
}
