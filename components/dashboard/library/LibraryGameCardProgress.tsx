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
  const hasAchievements = g.totalAchievements > 0;
  const unit = g.platform === "epic" ? "XP" : "succès";

  return (
    <button
      type="button"
      onClick={() => onSelectGame(g.appId)}
      className="block w-full text-left"
    >
      <h3 className="truncate text-sm font-semibold text-white group-hover:text-sky-300">
        {g.name}
      </h3>
      <div className="mt-1 flex items-center justify-between gap-2 text-xs text-slate-400">
        <span className="truncate tabular-nums">
          {hasAchievements ? `${g.unlockedCount} / ${g.totalAchievements} ${unit}` : "Aucun succès"}
          {g.playtimeHours !== undefined && g.playtimeHours > 0 && (
            <span className="text-slate-500"> · {g.playtimeHours} h</span>
          )}
        </span>
        {hasAchievements && (
          <span
            className={`font-medium tabular-nums ${
              isPlatinum ? "text-amber-400" : pct > 0 ? "text-slate-200" : "text-slate-500"
            }`}
          >
            {pct}%
          </span>
        )}
      </div>

      {hasAchievements && (
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className={`h-full rounded-full ${isPlatinum ? "bg-amber-400" : "bg-sky-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </button>
  );
}
