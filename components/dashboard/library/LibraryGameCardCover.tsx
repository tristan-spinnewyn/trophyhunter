// components/dashboard/library/LibraryGameCardCover.tsx

import { Trophy, Clock } from "lucide-react";
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
    <div
      onClick={() => onSelectGame(g.appId)}
      className="relative h-36 sm:h-40 w-full cursor-pointer overflow-hidden bg-slate-950"
    >
      <img
        src={g.headerImg}
        alt={g.name}
        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        onError={(e) => {
          (e.target as HTMLElement).style.display = "none";
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

      <span
        className={`absolute left-2.5 top-2.5 rounded-lg border px-2 py-0.5 text-[10px] font-bold backdrop-blur-md ${pMeta.badgeClass}`}
      >
        {pMeta.shortName}
      </span>

      {isPlatinum ? (
        <span className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-lg border border-amber-400/50 bg-amber-500/20 px-2 py-0.5 text-[10px] font-black text-amber-300 backdrop-blur-md">
          <Trophy className="h-3 w-3 fill-amber-400" />
          100%
        </span>
      ) : g.totalAchievements > 0 ? (
        <span className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-lg border border-slate-700/80 bg-slate-950/80 px-2 py-0.5 text-[10px] font-bold text-slate-200 backdrop-blur-md">
          <Trophy className="h-2.5 w-2.5 text-amber-400" />
          {g.totalAchievements} {g.platform === "epic" ? "XP" : "succès"}
        </span>
      ) : (
        <span className="absolute right-2.5 top-2.5 rounded-lg border border-slate-800 bg-slate-950/90 px-2 py-0.5 text-[10px] font-semibold text-slate-400 backdrop-blur-md">
          Sans succès
        </span>
      )}

      {g.playtimeHours !== undefined && g.playtimeHours > 0 && (
        <span className="absolute bottom-2 right-2.5 flex items-center gap-1 rounded bg-slate-950/80 px-1.5 py-0.5 text-[10px] text-slate-300">
          <Clock className="h-2.5 w-2.5 text-sky-400" />
          {g.playtimeHours} h
        </span>
      )}
    </div>
  );
}
