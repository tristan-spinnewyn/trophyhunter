// components/GameHeader.tsx
"use client";

import type { GameHeaderProps } from "./game-header/GameHeader.types";
import { GameHeaderActions } from "./game-header/GameHeaderActions";
import { GameHeaderGuides } from "./game-header/GameHeaderGuides";
import { GameHuntingMetaBar } from "./hunting/GameHuntingMetaBar";

export default function GameHeader({
  game,
  isFavorite,
  onToggleFavorite,
  isOwned = false,
  onToggleOwned,
  gameStatus,
  onChangeGameStatus,
  huntingMeta,
  onSaveHuntingOverride,
  onBackToLibrary,
}: GameHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-xl">
      <div className="relative h-44 sm:h-56 w-full overflow-hidden bg-slate-950">
        <img
          src={game.headerImg}
          alt={game.name}
          className="h-full w-full object-cover object-center filter blur-[1px] opacity-60 transition duration-700 hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/40 to-transparent" />

        <GameHeaderActions
          isFavorite={isFavorite}
          onToggleFavorite={onToggleFavorite}
          isOwned={isOwned}
          onToggleOwned={onToggleOwned}
          gameStatus={gameStatus}
          onChangeGameStatus={onChangeGameStatus}
          onBackToLibrary={onBackToLibrary}
        />
      </div>

      <div className="relative -mt-16 px-4 pb-4 sm:px-6 sm:pb-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex items-start gap-4">
            <img
              src={game.headerImg}
              alt={game.name}
              className="h-20 w-32 sm:h-24 sm:w-40 rounded-2xl object-cover shadow-2xl border-2 border-slate-700/80 bg-slate-800 shrink-0"
            />
            <div className="space-y-1 pt-2 sm:pt-4">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white line-clamp-2">
                {game.name}
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span className="font-semibold text-sky-400">
                  {game.totalAchievements} succès
                </span>
                {game.developers && game.developers.length > 0 && (
                  <>
                    <span>•</span>
                    <span>{game.developers.join(", ")}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {huntingMeta && (
          <GameHuntingMetaBar
            meta={huntingMeta}
            onSaveOverride={onSaveHuntingOverride}
          />
        )}

        <GameHeaderGuides game={game} />
      </div>
    </div>
  );
}
