// components/dashboard/gamepass/GamePassPanel.types.ts

import type { OwnedGame, PlatformType } from "@/lib/types";
import type { GamePassCatalogItem } from "@/lib/gamepass/gamepass.types";

export type GamePassFeatureFilter =
  | "all"
  | "achievements"
  | "play-anywhere"
  | "owned"
  | "unowned";

export interface GamePassFilterParams {
  readonly catalog: readonly GamePassCatalogItem[];
  readonly ownedGames: readonly OwnedGame[];
  readonly searchQuery: string;
  readonly categoryFilter: string;
  readonly featureFilter: GamePassFeatureFilter;
}

export interface GamePassPanelProps {
  readonly ownedGames: readonly OwnedGame[];
  readonly wishlistIds: readonly number[];
  readonly onAddGameToXbox: (item: GamePassCatalogItem) => Promise<void>;
  readonly onToggleWishlist: (appId: number, platform: PlatformType) => Promise<void>;
  readonly onSelectGame: (appId: number, name: string) => void;
  readonly onBackToAll: () => void;
}
