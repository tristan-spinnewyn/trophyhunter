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
}

export function GameHeaderBackButton({ onBackToLibrary }: { readonly onBackToLibrary: () => void }) {
  return (
    <button
      type="button"
      onClick={onBackToLibrary}
      className="absolute left-3 top-3 sm:left-4 sm:top-4 flex items-center gap-1.5 rounded-lg bg-slate-950/70 px-2.5 py-1.5 text-sm font-medium text-slate-200 backdrop-blur-md transition hover:bg-slate-950 hover:text-white"
    >
      <ArrowLeft className="h-4 w-4" />
      <span>Bibliothèque</span>
    </button>
  );
}

export function GameHeaderActions({
  isFavorite,
  onToggleFavorite,
  isOwned = false,
  onToggleOwned,
  gameStatus,
  onChangeGameStatus,
}: ActionsProps) {
  const currentStatus = resolveGameStatus(gameStatus);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {onChangeGameStatus && (
        <div role="group" aria-label="Statut du jeu" className="flex items-center gap-0.5 rounded-lg border border-slate-800 bg-slate-950/60 p-0.5">
          {GAME_STATUS_OPTIONS.map((opt) => {
            const isActive = isOwned && currentStatus === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChangeGameStatus(opt.value)}
                aria-pressed={isActive}
                className={`rounded-md border px-2.5 py-1 text-sm font-medium transition ${
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
          className={`flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition ${
            isOwned
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
              : "border-sky-500 bg-sky-500 text-slate-950 hover:bg-sky-400"
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
              <Plus className="h-4 w-4" />
              <span>Ajouter à mes jeux</span>
            </>
          )}
        </button>
      )}

      <button
        onClick={onToggleFavorite}
        className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${
          isFavorite
            ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
            : "border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white"
        }`}
        title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
        aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
        aria-pressed={isFavorite}
      >
        <Star className={`h-4 w-4 ${isFavorite ? "fill-amber-400" : ""}`} />
      </button>
    </div>
  );
}
