// components/library/card/LibraryCardActionButtons.tsx

import { Heart, FolderPlus, Unlink, RefreshCw, Trash2 } from "lucide-react";
import type { OwnedGame, PlatformType, CollectionWithGames } from "@/lib/types";
import { useConfirm } from "@/components/ui/confirm/useConfirm";

interface LibraryCardActionButtonsProps {
  game: OwnedGame;
  activePlatformTab: string;
  selectedCollId: string | null;
  wishlistIds: number[];
  collections: CollectionWithGames[];
  canSync: boolean;
  onToggleWishlist: (appId: number, platform: PlatformType) => void;
  onOpenAddToCollection: (game: OwnedGame) => void;
  onRemoveFromCollection: (collId: string, appId: number, platform: PlatformType) => void;
  onSyncGame: (game: OwnedGame) => Promise<void>;
  onRemoveGame: (appId: number, platform: PlatformType) => Promise<void>;
}

const ICON_BUTTON_CLASS =
  "flex h-8 w-8 items-center justify-center rounded-md text-faint transition hover:bg-edge";

export function LibraryCardActionButtons({
  game: g,
  activePlatformTab,
  selectedCollId,
  wishlistIds,
  collections,
  canSync,
  onToggleWishlist,
  onOpenAddToCollection,
  onRemoveFromCollection,
  onSyncGame,
  onRemoveGame,
}: LibraryCardActionButtonsProps) {
  const confirm = useConfirm();
  const isWishlisted = wishlistIds.includes(g.appId);
  const wishlistLabel = isWishlisted ? "Retirer de ma liste d'envies" : "Ajouter à ma liste d'envies";
  const syncLabel = g.platform === "epic" ? "Synchroniser les succès Epic Games" : "Actualiser les succès Steam";

  return (
    <div className="flex items-center">
      <button
        type="button"
        onClick={() => onToggleWishlist(g.appId, g.platform)}
        title={wishlistLabel}
        aria-label={wishlistLabel}
        aria-pressed={isWishlisted}
        className={`${ICON_BUTTON_CLASS} ${isWishlisted ? "text-danger" : "hover:text-danger"}`}
      >
        <Heart className={`h-4 w-4 ${isWishlisted ? "fill-current" : ""}`} />
      </button>

      {collections.length > 0 && (
        <button
          type="button"
          onClick={() => onOpenAddToCollection(g)}
          title="Ajouter à une collection"
          aria-label="Ajouter à une collection"
          className={`${ICON_BUTTON_CLASS} hover:text-paused`}
        >
          <FolderPlus className="h-4 w-4" />
        </button>
      )}

      {activePlatformTab === "collections" && selectedCollId && (
        <button
          type="button"
          onClick={() => onRemoveFromCollection(selectedCollId, g.appId, g.platform)}
          title="Retirer de cette collection"
          aria-label="Retirer de cette collection"
          className={`${ICON_BUTTON_CLASS} hover:text-lamp-bright`}
        >
          <Unlink className="h-4 w-4" />
        </button>
      )}

      {canSync && (
        <button
          type="button"
          onClick={() => onSyncGame(g)}
          title={syncLabel}
          aria-label={syncLabel}
          className={`${ICON_BUTTON_CLASS} hover:text-done`}
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      )}

      <button
        type="button"
        onClick={async () => {
          const confirmed = await confirm({
            title: `Retirer « ${g.name} » ?`,
            message: "Le jeu quittera ta collection, avec ses succès cochés et tes notes.",
            confirmLabel: "Retirer",
          });
          if (confirmed) await onRemoveGame(g.appId, g.platform);
        }}
        title="Retirer de ma bibliothèque"
        aria-label="Retirer de ma bibliothèque"
        className={`${ICON_BUTTON_CLASS} hover:text-danger`}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
