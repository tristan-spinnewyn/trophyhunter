// components/dashboard/library/LibraryGameCardActions.tsx

import type { ReactNode } from "react";
import type { OwnedGame, PlatformType, CollectionWithGames } from "@/lib/types";
import { LibraryCardActionButtons } from "./LibraryCardActionButtons";

interface LibraryGameCardActionsProps {
  game: OwnedGame;
  activePlatformTab: string;
  selectedCollId: string | null;
  wishlistIds: number[];
  collections: CollectionWithGames[];
  canSync: boolean;
  statusSelector: ReactNode;
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
  statusSelector,
  onToggleWishlist,
  onOpenAddToCollection,
  onRemoveFromCollection,
  onSyncGame,
  onRemoveGame,
}: LibraryGameCardActionsProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      {statusSelector}

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
