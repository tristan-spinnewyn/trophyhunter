// components/game-header/GameHeaderGuides.tsx

import { ExternalLink, BookOpen, Trophy, Video, Gamepad2 } from "lucide-react";
import type { GameDetails } from "@/lib/types";

export function GameHeaderGuides({ game }: { game: GameDetails }) {
  return (
    <div className="mt-4 flex flex-wrap gap-2 pt-2 border-t border-slate-800/80">
      <a
        href={game.guideLinks.psthcUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
      >
        <Trophy className="h-3.5 w-3.5" />
        Guide PSTHC (FR)
        <ExternalLink className="h-3 w-3 opacity-60" />
      </a>

      <a
        href={game.guideLinks.steamGuidesUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 rounded-xl border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-300 transition hover:bg-sky-500/20"
      >
        <BookOpen className="h-3.5 w-3.5" />
        Guides Steam
        <ExternalLink className="h-3 w-3 opacity-60" />
      </a>

      <a
        href={game.guideLinks.youtubeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20"
      >
        <Video className="h-3.5 w-3.5" />
        Vidéos YouTube FR
        <ExternalLink className="h-3 w-3 opacity-60" />
      </a>

      <a
        href={`https://store.steampowered.com/app/${game.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-700/80"
      >
        <Gamepad2 className="h-3.5 w-3.5" />
        Magasin Steam
        <ExternalLink className="h-3 w-3 opacity-60" />
      </a>
    </div>
  );
}
