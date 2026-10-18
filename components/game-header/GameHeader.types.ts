// components/game-header/GameHeader.types.ts

import type { GameDetails, GameStatus } from "@/lib/types";

export interface GameHeaderProps {
  readonly game: GameDetails;
  readonly isFavorite: boolean;
  readonly onToggleFavorite: () => void;
  readonly isOwned?: boolean;
  readonly onToggleOwned?: () => void;
  readonly gameStatus?: GameStatus;
  readonly onChangeGameStatus?: (status: GameStatus) => void;
  readonly onBackToLibrary?: () => void;
}
