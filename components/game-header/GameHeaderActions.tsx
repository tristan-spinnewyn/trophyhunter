// components/game-header/GameHeaderActions.tsx
"use client";

import { Star, Check, Plus, ArrowLeft } from "lucide-react";
import type { GameStatus } from "@/lib/types";
import {
  GAME_STATUS_OPTIONS,
  resolveGameStatus,
} from "@/lib/game-status/game-status.services";

interface ActionsProps {
  readonly isFavorite: boolean;
  readonly onToggleFavorite: () => void;
  readonly isOwned?: boolean;
  readonly onToggleOwned?: () => void;
  readonly gameStatus?: GameStatus;
  readonly onChangeGameStatus?: (status: GameStatus) => void;
  readonly onBackToLibrary?: () => void;
}

export function GameHeaderActions({
  isFavorite,
  onToggleFavorite,
  isOwned = false,
  onToggleOwned,
  gameStatus,
  onChangeGameStatus,
  onBackToLibrary,
}: ActionsProps) {
  const currentStatus = resolveGameStatus(gameStatus);

  return (
    <>
      {onBackToLibrary && (
        <button
          onClick={onBackToLibrary}
          className="absolute left-4 top-4 flex items-center gap-1.5 rounded-2xl border border-slate-700/70 bg-slate-950/70 px-3 py-2 text-xs font-semibold text-slate-200 backdrop-blur-md transition hover:border-sky-500/50 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Ma Bibliothèque</span>
        </button>
      )}

      <div className="absolute right-4 top-4 flex flex-wrap items-center justify-end gap-2">
        {onChangeGameStatus && (
          <div className="flex items-center gap-1 rounded-2xl border border-slate-700/60 bg-slate-950/75 p-1 backdrop-blur-md">
            {GAME_STATUS_OPTIONS.map((opt) => {
              const isActive = isOwned && currentStatus === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onChangeGameStatus(opt.value)}
                  className={`rounded-xl border px-2.5 py-1.5 text-xs font-bold transition ${
                    isActive
                      ? opt.activeButtonClass
                      : "border-transparent text-slate-300 hover:bg-slate-800/80 hover:text-white"
                  }`}
                >
                  {opt.shortLabel}
                </button>
              );
            })}
          </div>
        )}

        {onToggleOwned && (
          <button
            onClick={onToggleOwned}
            className={`flex h-10 items-center gap-1.5 rounded-2xl border px-3 text-xs font-bold backdrop-blur-md transition ${
              isOwned
                ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-300"
                : "border-slate-700/60 bg-slate-950/70 text-slate-300 hover:border-sky-500/50 hover:text-white"
            }`}
            title={isOwned ? "Retirer de mes jeux possédés" : "Ajouter à mes jeux possédés"}
          >
            {isOwned ? (
              <>
                <Check className="h-4 w-4 text-emerald-400" />
                <span>Possédé</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 text-sky-400" />
                <span>Ajouter à mes jeux</span>
              </>
            )}
          </button>
        )}

        <button
          onClick={onToggleFavorite}
          className={`flex h-10 w-10 items-center justify-center rounded-2xl border backdrop-blur-md transition ${
            isFavorite
              ? "border-amber-500/50 bg-amber-500/20 text-amber-400"
              : "border-slate-700/60 bg-slate-950/60 text-slate-400 hover:text-white"
          }`}
          title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <Star className={`h-5 w-5 ${isFavorite ? "fill-amber-400" : ""}`} />
        </button>
      </div>
    </>
  );
}
