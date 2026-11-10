// components/library/triage/TriageGameSheet.tsx

import type { OwnedGame } from "@/lib/types";
import { PLATFORM_META } from "@/lib/platforms";
import { getPortraitCoverUrl } from "@/lib/library/cover-image";
import { formatLastSession } from "@/lib/library/last-session";
import { fallBackThenHide } from "@/components/ui/coverFallback";

interface TriageGameSheetProps {
  readonly game: OwnedGame;
  readonly now?: Date;
}

/** What is known about the game being sorted: enough to decide without opening its page. */
export function TriageGameSheet({ game, now }: TriageGameSheetProps) {
  const lastSession = formatLastSession(game.lastPlayed, now);
  const hours = Math.round(game.playtimeHours ?? 0);

  return (
    <div className="flex gap-4">
      <div className="aspect-[2/3] w-24 shrink-0 overflow-hidden rounded-object bg-edge sm:w-28">
        <img
          key={`${game.platform}_${game.appId}`}
          src={getPortraitCoverUrl(game)}
          alt=""
          className="h-full w-full object-cover"
          onError={fallBackThenHide(game.headerImg)}
        />
      </div>
      <div className="min-w-0 space-y-2">
        <h3 className="font-semiwide text-xl font-bold leading-tight text-paper">{game.name}</h3>
        <p className="text-sm text-dust">{PLATFORM_META[game.platform]?.shortName}</p>
        <ul className="space-y-0.5 text-sm text-paper-dim">
          <li>{hours > 0 ? `${hours.toLocaleString("fr-FR")} h de jeu` : "Aucun temps de jeu connu"}</li>
          {lastSession && <li>Dernière session {lastSession}</li>}
          {game.totalAchievements > 0 && (
            <li className="text-platinum">
              {game.unlockedCount}/{game.totalAchievements} succès
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
