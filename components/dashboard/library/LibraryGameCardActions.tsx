// components/dashboard/library/LibraryGameCardActions.tsx

import { ChevronRight } from "lucide-react";
import type { OwnedGame, PlatformType } from "@/lib/types";
import type { LocalCollection } from "@/lib/storage";
import { LibraryCardActionButtons } from "./LibraryCardActionButtons";

interface LibraryGameCardActionsProps {
  game: OwnedGame;
  activePlatformTab: string;
  selectedCollId: string | null;
  wishlistIds: number[];
  collections: LocalCollection[];
  canSync: boolean;
  onSelectGame: (appId: number) => void;
  onToggleWishlist: (appId: number, platform: PlatformType) => void;
  onOpenAddToCollection: (game: OwnedGame) => void;
  onRemoveFromCollection: (
    collectionId: string,
    appId: number,
    platform: PlatformType
  ) => void;
  onSyncGame: (game: OwnedGame) => Promise<void>;
  onRemoveGame: (appId: number, platform: PlatformType) => Promise<void>;
}

export function LibraryGameCardActions({
  game: g,
  activePlatformTab,
  selectedCollId,
  wishlistIds,
  collections,
  canSync,
  onSelectGame,
  onToggleWishlist,
  onOpenAddToCollection,
  onRemoveFromCollection,
  onSyncGame,
  onRemoveGame,
}: LibraryGameCardActionsProps) {
  return (
    <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-slate-800/70">
      <button
        onClick={() => onSelectGame(g.appId)}
        className="flex items-center gap-1 text-[11px] font-semibold text-sky-400 hover:text-sky-300"
      >
        Ouvrir les succès
        <ChevronRight className="h-3.5 w-3.5" />
      </button>

      <LibraryCardActionButtons
        game={g}
        activePlatformTab={activePlatformTab}
        selectedCollId={selectedCollId}
        wishlistIds={wishlistIds}
        collections={collections}
        canSync={canSync}
        onToggleWishlist={onToggleWishlist}
        onOpenAddToCollection={onOpenAddToCollection}
        onRemoveFromCollection={onRemoveFromCollection}
        onSyncGame={onSyncGame}
        onRemoveGame={onRemoveGame}
      />
    </div>
  );
}
