// components/game-header/GameHeaderActions.tsx
"use client";

import { Star, Trash2, ArrowLeft } from "lucide-react";
import type { GameStatus } from "@/lib/types";
import { resolveGameStatus } from "@/lib/game-status/game-status.services";
import { GameStatusSelect } from "@/components/game-status/GameStatusSelect";
import { useConfirm } from "@/components/ui/confirm/useConfirm";

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
      className="absolute left-3 top-3 sm:left-4 sm:top-4 flex items-center gap-1.5 rounded-lg bg-ink/70 px-2.5 py-1.5 text-sm font-medium text-paper backdrop-blur-md transition hover:bg-ink hover:text-paper"
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
  const confirm = useConfirm();

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
          onClick={async () => {
            const confirmed = await confirm({
              title: "Retirer ce jeu de ta collection ?",
              message: "Ses succès cochés et tes notes seront aussi supprimés.",
              confirmLabel: "Retirer",
            });
            if (confirmed) onToggleOwned();
          }}
          title="Retirer de ma collection"
          aria-label="Retirer de ma collection"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-edge text-dust transition hover:bg-edge hover:text-danger"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}

      <button
        type="button"
        onClick={onToggleFavorite}
        className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${
          isFavorite
            ? "border-lamp/40 bg-lamp/10 text-lamp-bright"
            : "border-edge text-dust hover:bg-edge hover:text-paper"
        }`}
        title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
        aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
        aria-pressed={isFavorite}
      >
        <Star className={`h-4 w-4 ${isFavorite ? "fill-lamp-bright" : ""}`} />
      </button>
    </div>
  );
}
