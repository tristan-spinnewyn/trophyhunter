// components/dashboard/library/LibraryGameCard.types.ts

import type {
  GameStatus,
  OwnedGame,
  PlatformAccount,
  PlatformType,
} from "@/lib/types";
import type { LocalCollection } from "@/lib/storage";

export interface LibraryGameCardProps {
  readonly game: OwnedGame;
  readonly steamAccount?: PlatformAccount;
  readonly activePlatformTab: string;
  readonly selectedCollId: string | null;
  readonly wishlistIds: number[];
  readonly collections: LocalCollection[];
  readonly onSelectGame: (appId: number) => void;
  readonly onToggleWishlist: (appId: number, platform: PlatformType) => void;
  readonly onOpenAddToCollection: (game: OwnedGame) => void;
  readonly onRemoveFromCollection: (
    collectionId: string,
    appId: number,
    platform: PlatformType
  ) => void;
  readonly onSyncGame: (game: OwnedGame) => Promise<void>;
  readonly onRemoveGame: (appId: number, platform: PlatformType) => Promise<void>;
  readonly onUpdateGameStatus?: (
    appId: number,
    platform: PlatformType,
    status: GameStatus
  ) => Promise<void> | void;
}
