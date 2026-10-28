// components/game-header/GameHeader.tsx
"use client";
import { GameHeaderActions, GameHeaderBackButton } from "./GameHeaderActions";
import { GameHeaderGuides } from "./GameHeaderGuides";
import { GameHuntingMetaBar } from "../hunting/GameHuntingMetaBar";
import type { GameDetails, GameStatus } from "@/lib/types";
import type { GameHuntingMeta, GameHuntingOverride } from "@/lib/hunting/hunting.types";

export interface GameHeaderProps {
  readonly game: GameDetails;
  readonly isFavorite: boolean;
  readonly onToggleFavorite: () => void;
  readonly isOwned?: boolean;
  readonly onToggleOwned?: () => void;
  readonly gameStatus?: GameStatus;
  readonly onChangeGameStatus?: (status: GameStatus) => void;
  readonly huntingMeta?: GameHuntingMeta;
  readonly onSaveHuntingOverride?: (override: GameHuntingOverride | undefined) => void;
  readonly onBackToLibrary?: () => void;
  /** Hours played, when the game is in the collection. */
  readonly playtimeHours?: number;
}

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
  playtimeHours,
}: GameHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
      <div className="relative h-32 sm:h-48 w-full overflow-hidden bg-slate-950">
        <img
          src={game.headerImg}
          alt={game.name}
          className="h-full w-full object-cover object-center opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/40 to-transparent" />

        {onBackToLibrary && <GameHeaderBackButton onBackToLibrary={onBackToLibrary} />}
      </div>

      <div className="relative -mt-12 sm:-mt-16 px-4 pb-4 sm:px-6 sm:pb-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="flex items-end gap-3 sm:gap-4 min-w-0">
            <img
              src={game.headerImg}
              alt={game.name}
              className="h-16 w-28 sm:h-24 sm:w-44 rounded-xl object-cover ring-1 ring-slate-700 bg-slate-800 shrink-0"
            />
            <div className="min-w-0 space-y-1">
              <h1 className="text-xl sm:text-3xl font-semibold tracking-tight text-white line-clamp-2">
                {game.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                {playtimeHours !== undefined && playtimeHours > 0 && (
                  <>
                    <span className="font-medium text-slate-200">{playtimeHours} h jouées</span>
                    <span>•</span>
                  </>
                )}
                <span>{game.totalAchievements} succès</span>
                {game.developers && game.developers.length > 0 && (
                  <>
                    <span>•</span>
                    <span className="truncate">{game.developers.join(", ")}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <GameHeaderActions
            isFavorite={isFavorite}
            onToggleFavorite={onToggleFavorite}
            isOwned={isOwned}
            onToggleOwned={onToggleOwned}
            gameStatus={gameStatus}
            onChangeGameStatus={onChangeGameStatus}
          />
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
