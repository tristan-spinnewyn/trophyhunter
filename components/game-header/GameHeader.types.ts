// components/game-header/GameHeader.types.ts

import type { GameDetails } from "@/lib/types";

export interface GameHeaderProps {
  game: GameDetails;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  isOwned?: boolean;
  onToggleOwned?: () => void;
  onBackToLibrary?: () => void;
}
