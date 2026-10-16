// components/dashboard/library/LibraryGameCardProgress.tsx

import type { OwnedGame } from "@/lib/types";

interface LibraryGameCardProgressProps {
  game: OwnedGame;
  isPlatinum: boolean;
  pct: number;
  onSelectGame: (appId: number) => void;
}

export function LibraryGameCardProgress({
  game: g,
  isPlatinum,
  pct,
  onSelectGame,
}: LibraryGameCardProgressProps) {
  return (
    <div onClick={() => onSelectGame(g.appId)} className="cursor-pointer">
      <h4 className="truncate text-sm font-bold text-white group-hover:text-sky-400">
        {g.name}
      </h4>
      <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
        <span>
          {g.totalAchievements > 0
            ? `${g.unlockedCount} / ${g.totalAchievements} succès`
            : "⚪ Aucun succès répertorié"}
        </span>
        <span
          className={`font-bold ${
            isPlatinum
              ? "text-amber-400"
              : pct > 0
              ? "text-sky-400"
              : "text-slate-500"
          }`}
        >
          {g.totalAchievements > 0 ? `${pct}%` : "—"}
        </span>
      </div>

      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full rounded-full transition-all ${
            isPlatinum
              ? "bg-gradient-to-r from-amber-400 to-emerald-400"
              : "bg-sky-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
