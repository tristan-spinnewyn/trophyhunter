// components/game-header/GameHeaderGuides.tsx

import { ExternalLink, BookOpen, Trophy, Video, Gamepad2 } from "lucide-react";
import type { GameDetails } from "@/lib/types";

export function GameHeaderGuides({ game }: { game: GameDetails }) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-2 pt-4 border-t border-slate-800 sm:flex sm:flex-wrap">
      <a
        href={game.guideLinks.psthcUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-1.5 text-sm text-slate-200 transition hover:border-slate-700 hover:bg-slate-800"
      >
        <Trophy className="h-3.5 w-3.5 text-emerald-400" />
        Guide PSTHC
        <ExternalLink className="h-3 w-3 text-slate-500" aria-hidden />
      </a>

      <a
        href={game.guideLinks.steamGuidesUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-1.5 text-sm text-slate-200 transition hover:border-slate-700 hover:bg-slate-800"
      >
        <BookOpen className="h-3.5 w-3.5 text-sky-400" />
        Guides Steam
        <ExternalLink className="h-3 w-3 text-slate-500" aria-hidden />
      </a>

      <a
        href={game.guideLinks.youtubeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-1.5 text-sm text-slate-200 transition hover:border-slate-700 hover:bg-slate-800"
      >
        <Video className="h-3.5 w-3.5 text-rose-400" />
        YouTube FR
        <ExternalLink className="h-3 w-3 text-slate-500" aria-hidden />
      </a>

      <a
        href={`https://store.steampowered.com/app/${game.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-1.5 text-sm text-slate-200 transition hover:border-slate-700 hover:bg-slate-800"
      >
        <Gamepad2 className="h-3.5 w-3.5 text-slate-400" />
        Magasin Steam
        <ExternalLink className="h-3 w-3 text-slate-500" aria-hidden />
      </a>
    </div>
  );
}
