// components/library/card/LibraryGameCardCover.tsx

import { Trophy } from "lucide-react";
import type { OwnedGame } from "@/lib/types";
import { PLATFORM_META } from "@/lib/platforms";

interface LibraryGameCardCoverProps {
  game: OwnedGame;
  isPlatinum: boolean;
  onSelectGame: (appId: number) => void;
}

export function LibraryGameCardCover({
  game: g,
  isPlatinum,
  onSelectGame,
}: LibraryGameCardCoverProps) {
  const pMeta = PLATFORM_META[g.platform] || PLATFORM_META.steam;

  return (
    <button
      type="button"
      onClick={() => onSelectGame(g.appId)}
      aria-label={`Ouvrir ${g.name}`}
      className="relative block aspect-[460/215] w-full overflow-hidden bg-slate-950"
    >
      <img
        src={g.headerImg}
        alt=""
        loading="lazy"
        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
        onError={(e) => {
          (e.target as HTMLElement).style.display = "none";
        }}
      />

      <span
        className={`absolute left-2 top-2 rounded-md border px-1.5 py-0.5 text-[11px] font-medium backdrop-blur-md ${pMeta.badgeClass}`}
      >
        {pMeta.shortName}
      </span>

      {isPlatinum && (
        <span className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-amber-400 px-1.5 py-0.5 text-[11px] font-semibold text-slate-950">
          <Trophy className="h-3 w-3" />
          100%
        </span>
      )}
    </button>
  );
}
