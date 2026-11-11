// components/game-header/GameHeaderGuides.tsx

import { ExternalLink, BookOpen, Trophy, Video, Gamepad2 } from "lucide-react";
import type { GameDetails } from "@/lib/types";
import { isManualGameId } from "@/lib/game/manual-game";

export function GameHeaderGuides({ game }: { game: GameDetails }) {
  // A game added by hand has no Steam page to link to.
  const hasSteamPage = !isManualGameId(game.id);
  return (
    <div className="mt-4 grid grid-cols-2 gap-2 pt-4 border-t border-edge sm:flex sm:flex-wrap">
      <a
        href={game.guideLinks.psthcUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 rounded-control border border-edge bg-ink/40 px-3 py-1.5 text-sm text-paper transition hover:border-seam hover:bg-edge"
      >
        <Trophy className="h-3.5 w-3.5 text-done" />
        Guide PSTHC
        <ExternalLink className="h-3 w-3 text-faint" aria-hidden />
      </a>

      {game.guideLinks.steamGuidesUrl && (
      <a
        href={game.guideLinks.steamGuidesUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 rounded-control border border-edge bg-ink/40 px-3 py-1.5 text-sm text-paper transition hover:border-seam hover:bg-edge"
      >
        <BookOpen className="h-3.5 w-3.5 text-lamp-bright" />
        Guides Steam
        <ExternalLink className="h-3 w-3 text-faint" aria-hidden />
      </a>
      )}

      <a
        href={game.guideLinks.youtubeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 rounded-control border border-edge bg-ink/40 px-3 py-1.5 text-sm text-paper transition hover:border-seam hover:bg-edge"
      >
        <Video className="h-3.5 w-3.5 text-danger" />
        YouTube FR
        <ExternalLink className="h-3 w-3 text-faint" aria-hidden />
      </a>

      {hasSteamPage && (
      <a
        href={`https://store.steampowered.com/app/${game.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 rounded-control border border-edge bg-ink/40 px-3 py-1.5 text-sm text-paper transition hover:border-seam hover:bg-edge"
      >
        <Gamepad2 className="h-3.5 w-3.5 text-dust" />
        Magasin Steam
        <ExternalLink className="h-3 w-3 text-faint" aria-hidden />
      </a>
      )}
    </div>
  );
}
