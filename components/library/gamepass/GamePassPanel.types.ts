// components/library/gamepass/GamePassPanel.types.ts

import type { OwnedGame, PlatformType } from "@/lib/types";
import type { GamePassCatalogItem } from "@/lib/gamepass/gamepass.types";

export interface GamePassPanelProps {
  readonly ownedGames: readonly OwnedGame[];
  readonly wishlistIds: readonly number[];
  readonly onAddGameToXbox: (item: GamePassCatalogItem) => Promise<void>;
  readonly onToggleWishlist: (appId: number, platform: PlatformType) => Promise<void>;
  readonly onSelectGame: (appId: number, name: string) => void;
}
