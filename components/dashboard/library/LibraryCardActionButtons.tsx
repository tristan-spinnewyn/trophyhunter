// components/dashboard/library/LibraryCardActionButtons.tsx

import { Heart, FolderPlus, Unlink, RefreshCw, Trash2 } from "lucide-react";
import type { OwnedGame, PlatformType } from "@/lib/types";
import type { LocalCollection } from "@/lib/storage";

interface LibraryCardActionButtonsProps {
  game: OwnedGame;
  activePlatformTab: string;
  selectedCollId: string | null;
  wishlistIds: number[];
  collections: LocalCollection[];
  canSync: boolean;
  onToggleWishlist: (appId: number, platform: PlatformType) => void;
  onOpenAddToCollection: (game: OwnedGame) => void;
  onRemoveFromCollection: (collId: string, appId: number, platform: PlatformType) => void;
  onSyncGame: (game: OwnedGame) => Promise<void>;
  onRemoveGame: (appId: number, platform: PlatformType) => Promise<void>;
}

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
  const isWishlisted = wishlistIds.includes(g.appId);

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onToggleWishlist(g.appId, g.platform)}
        title={isWishlisted ? "Retirer de ma liste d'envies" : "Ajouter à ma liste d'envies"}
        className={`rounded-lg p-1 transition ${
          isWishlisted ? "text-rose-400 bg-rose-500/10" : "text-slate-500 hover:bg-slate-800 hover:text-rose-400"
        }`}
      >
        <Heart className={`h-3.5 w-3.5 ${isWishlisted ? "fill-current" : ""}`} />
      </button>

      {collections.length > 0 && (
        <button
          onClick={() => onOpenAddToCollection(g)}
          title="Ajouter à une collection"
          className="rounded-lg p-1 text-slate-500 hover:bg-slate-800 hover:text-indigo-400 transition"
        >
          <FolderPlus className="h-3.5 w-3.5" />
        </button>
      )}

      {activePlatformTab === "collections" && selectedCollId && (
        <button
          onClick={() => onRemoveFromCollection(selectedCollId, g.appId, g.platform)}
          title="Retirer de cette collection"
          className="rounded-lg p-1 text-slate-500 hover:bg-slate-800 hover:text-amber-400 transition"
        >
          <Unlink className="h-3.5 w-3.5" />
        </button>
      )}

      {canSync && (
        <button
          onClick={() => onSyncGame(g)}
          title={g.platform === "epic" ? "Synchroniser les succès Epic Games" : "Actualiser les succès Steam"}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-emerald-400 transition"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      )}

      <button
        onClick={() => onRemoveGame(g.appId, g.platform)}
        title="Retirer de ma bibliothèque"
        className="rounded-lg p-1 text-slate-500 hover:bg-slate-800 hover:text-rose-400 transition"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
