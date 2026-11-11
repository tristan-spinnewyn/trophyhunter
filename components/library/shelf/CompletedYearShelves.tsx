// components/library/shelf/CompletedYearShelves.tsx

import { useId } from "react";
import type { OwnedGame } from "@/lib/types";
import { groupCompletedByYear, type CompletedYearGroup } from "@/lib/library/completed-by-year";
import { GameSpine } from "./GameSpine";

interface CompletedYearShelvesProps {
  readonly games: readonly OwnedGame[];
  readonly onOpen: (game: OwnedGame) => void;
  readonly gameKey: (game: OwnedGame) => string;
}

const countLabel = (n: number) => `${n} ${n > 1 ? "jeux" : "jeu"}`;

/** The finished shelf, one row of spines per year it was finished in. */
export function CompletedYearShelves({ games, onOpen, gameKey }: CompletedYearShelvesProps) {
  return (
    <div className="space-y-6 pb-2">
      {groupCompletedByYear(games).map((group) => (
        <YearShelf key={group.key} group={group} onOpen={onOpen} gameKey={gameKey} />
      ))}
    </div>
  );
}

function YearShelf({
  group,
  onOpen,
  gameKey,
}: {
  readonly group: CompletedYearGroup;
  readonly onOpen: (game: OwnedGame) => void;
  readonly gameKey: (game: OwnedGame) => string;
}) {
  const headingId = useId();
  return (
    <div role="group" aria-labelledby={headingId}>
      <div className="mb-3 flex items-baseline gap-2">
        <h4 id={headingId} className="font-semiwide text-base font-bold text-paper-dim">
          {group.label}
        </h4>
        <span className="text-sm tabular-nums text-dust">{countLabel(group.games.length)}</span>
      </div>
      <div className="spine-rows">
        {group.games.map((g) => (
          <GameSpine key={gameKey(g)} game={g} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}
