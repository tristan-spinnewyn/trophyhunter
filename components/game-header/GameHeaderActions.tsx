// components/game-header/GameHeaderActions.tsx
"use client";

import { Star, Trash2, ArrowLeft } from "lucide-react";
import type { GameStatus } from "@/lib/types";
import { resolveGameStatus } from "@/lib/game-status/game-status.services";
import { GameStatusSelect } from "@/components/game-status/GameStatusSelect";

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
      <span>Ma collection</span>
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
  return (
    <div className="flex flex-wrap items-center gap-2">
      {onChangeGameStatus && (
        <GameStatusSelect
          status={isOwned ? resolveGameStatus(gameStatus) : null}
          onChange={onChangeGameStatus}
          ariaLabel="Statut du jeu"
          className="h-9 px-3 text-sm"
        />
      )}

      {isOwned && onToggleOwned && (
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Retirer ce jeu de ta collection ?")) onToggleOwned();
          }}
          title="Retirer de ma collection"
          aria-label="Retirer de ma collection"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 text-slate-400 transition hover:bg-slate-800 hover:text-rose-400"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}

      <button
        type="button"
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
