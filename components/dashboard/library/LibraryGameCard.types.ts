// components/dashboard/library/LibraryGameCard.types.ts

import type { OwnedGame, PlatformAccount, PlatformType } from "@/lib/types";
import type { LocalCollection } from "@/lib/storage";

export interface LibraryGameCardProps {
  game: OwnedGame;
  steamAccount?: PlatformAccount;
  activePlatformTab: string;
  selectedCollId: string | null;
  wishlistIds: number[];
  collections: LocalCollection[];
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
