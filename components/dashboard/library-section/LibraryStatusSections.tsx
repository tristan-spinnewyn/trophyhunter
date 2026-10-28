// components/dashboard/library-section/LibraryStatusSections.tsx

import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import type { OwnedGame } from "@/lib/types";
import { groupGamesByStatus } from "@/lib/library/library-tracking";

interface LibraryStatusSectionsProps {
  readonly games: OwnedGame[];
  readonly renderGame: (game: OwnedGame) => ReactNode;
}

/** The collection split by tracking status: what I play now first, the archive folded. */
export function LibraryStatusSections({ games, renderGame }: LibraryStatusSectionsProps) {
  return (
    <div className="space-y-6">
      {groupGamesByStatus(games).map((section) => (
        <details key={section.status} open={section.isOpenByDefault} className="group">
          <summary className="flex cursor-pointer list-none items-center gap-2 py-1 text-white [&::-webkit-details-marker]:hidden">
            <h3 className="text-base font-semibold">{section.title}</h3>
            <span className="text-sm tabular-nums text-slate-500">{section.games.length}</span>
            <ChevronDown className="h-4 w-4 text-slate-500 transition -rotate-90 group-open:rotate-0" />
          </summary>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {section.games.map(renderGame)}
          </div>
        </details>
      ))}
    </div>
  );
}
