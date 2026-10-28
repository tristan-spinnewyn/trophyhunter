// components/library/card/LibraryGameCardProgress.tsx

import type { OwnedGame } from "@/lib/types";
import { formatLastSession } from "@/lib/library/last-session";

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
  const lastSession = formatLastSession(g.lastPlayed);
  const hasPlaytime = g.playtimeHours !== undefined && g.playtimeHours > 0;
  const activity = [hasPlaytime ? `${g.playtimeHours} h` : null, lastSession ? `joué ${lastSession}` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <button
      type="button"
      onClick={() => onSelectGame(g.appId)}
      className="block w-full text-left"
    >
      <h3 className="truncate text-sm font-semibold text-white group-hover:text-sky-300">
        {g.name}
      </h3>
      <p className="mt-1 truncate text-xs text-slate-300">
        {activity || (
          <span className="text-slate-500">
            {g.unlockedCount > 0 ? "Temps de jeu inconnu" : "Pas encore lancé"}
          </span>
        )}
      </p>

      {hasAchievements && (
        <div className="mt-2 flex items-center gap-2" title={`${pct} % des ${unit}`}>
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full rounded-full ${isPlatinum ? "bg-amber-400" : "bg-slate-500"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className={`shrink-0 text-[11px] tabular-nums ${isPlatinum ? "text-amber-400" : "text-slate-500"}`}>
            {g.unlockedCount}/{g.totalAchievements} {unit}
          </span>
        </div>
      )}
    </button>
  );
}
