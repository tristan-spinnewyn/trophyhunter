// components/library/card/LibraryGameCardCover.tsx

import { Trophy } from "lucide-react";
import type { OwnedGame } from "@/lib/types";
import { PLATFORM_META } from "@/lib/platforms";
import { getPortraitCoverUrl } from "@/lib/library/cover-image";
import { fallBackThenHide } from "@/components/ui/coverFallback";

interface LibraryGameCardCoverProps {
  game: OwnedGame;
  isPlatinum: boolean;
  onSelectGame: (appId: number) => void;
}

export function LibraryGameCardCover({ game: g, isPlatinum, onSelectGame }: LibraryGameCardCoverProps) {
  const pMeta = PLATFORM_META[g.platform] || PLATFORM_META.steam;

  return (
    <button
      type="button"
      onClick={() => onSelectGame(g.appId)}
      aria-label={`Ouvrir ${g.name}`}
      className="relative block aspect-[2/3] w-full overflow-hidden rounded-object bg-plank shadow-[inset_0_2px_0_rgb(255_255_255/.06),0_18px_30px_-12px_rgb(0_0_0/.7)] transition-transform duration-300 group-hover:-translate-y-1.5"
    >
      <img
        src={getPortraitCoverUrl(g)}
        alt=""
        loading="lazy"
        className="h-full w-full object-cover"
        onError={fallBackThenHide(g.headerImg)}
      />

      <span className="absolute left-2 top-2 rounded-control bg-ink/80 px-1.5 py-0.5 text-[11px] font-semibold text-paper-dim backdrop-blur-md">
        {pMeta.shortName}
      </span>

      {isPlatinum && (
        <span className="absolute right-2 top-2 flex items-center gap-1 rounded-control bg-platinum px-1.5 py-0.5 text-[11px] font-semibold text-ink">
          <Trophy className="h-3 w-3" />
          100%
        </span>
      )}
    </button>
  );
}
