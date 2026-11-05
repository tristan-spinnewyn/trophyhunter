// components/game-header/GameHeaderActions.tsx
"use client";

import { Star, Trash2, ArrowLeft } from "lucide-react";
import { useConfirm } from "@/components/ui/confirm/useConfirm";

interface ActionsProps {
  readonly isFavorite: boolean;
  readonly onToggleFavorite: () => void;
  readonly isOwned?: boolean;
  readonly onToggleOwned?: () => void;
}

export function GameHeaderBackButton({ onBackToLibrary }: { readonly onBackToLibrary: () => void }) {
  return (
    <button
      type="button"
      onClick={onBackToLibrary}
      className="flex items-center gap-1.5 text-sm font-medium text-paper/80 transition hover:text-paper"
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
}: ActionsProps) {
  const confirm = useConfirm();

  return (
    <div className="flex flex-wrap items-center gap-1">

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
          className="flex h-9 items-center gap-2 rounded-control px-2.5 text-sm font-semibold text-dust transition hover:bg-plank hover:text-danger"
        >
          <Trash2 className="h-4 w-4" />
          <span aria-hidden>Retirer</span>
        </button>
      )}

      <button
        type="button"
        onClick={onToggleFavorite}
        className={`flex h-9 items-center gap-2 rounded-control px-2.5 text-sm font-semibold transition hover:bg-plank ${
          isFavorite ? "text-lamp-bright" : "text-dust hover:text-paper"
        }`}
        title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
        aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
        aria-pressed={isFavorite}
      >
        <Star className={`h-4 w-4 ${isFavorite ? "fill-lamp-bright" : ""}`} />
        <span aria-hidden>Favori</span>
      </button>
    </div>
  );
}
