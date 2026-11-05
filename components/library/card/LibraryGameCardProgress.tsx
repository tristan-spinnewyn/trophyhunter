// components/library/card/LibraryGameCardProgress.tsx

import type { OwnedGame } from "@/lib/types";
import { formatLastSession } from "@/lib/library/last-session";

interface LibraryGameCardProgressProps {
  game: OwnedGame;
  isPlatinum: boolean;
  pct: number;
  onSelectGame: (appId: number) => void;
}

export function LibraryGameCardProgress({ game: g, isPlatinum, pct, onSelectGame }: LibraryGameCardProgressProps) {
  const hasAchievements = g.totalAchievements > 0;
  const unit = g.platform === "epic" ? "XP" : "succès";
  const lastSession = formatLastSession(g.lastPlayed);
  const hasPlaytime = g.playtimeHours !== undefined && g.playtimeHours > 0;
  const activity = [hasPlaytime ? `${g.playtimeHours} h` : null, lastSession ? `joué ${lastSession}` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <button type="button" onClick={() => onSelectGame(g.appId)} className="block w-full text-left">
      <h3 className="truncate text-[17px] font-bold leading-snug text-paper">{g.name}</h3>
      <p className="mt-0.5 truncate text-sm tabular-nums text-dust">
        {activity || <span className="text-faint">{g.unlockedCount > 0 ? "Temps de jeu inconnu" : "Pas encore lancé"}</span>}
      </p>

      {hasAchievements && (
        <div className="mt-2 flex items-center gap-2 text-platinum/75" title={`${pct} % des ${unit}`}>
          <div className="h-[3px] w-11 overflow-hidden rounded-full bg-seam">
            <div className={`h-full ${isPlatinum ? "bg-platinum" : "bg-platinum/80"}`} style={{ width: `${pct}%` }} />
          </div>
          <span className="shrink-0 text-[13px] tabular-nums">
            {g.unlockedCount}/{g.totalAchievements} {unit}
          </span>
        </div>
      )}
    </button>
  );
}
