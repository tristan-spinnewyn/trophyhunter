// components/game-header/GameHeader.types.ts

import type { GameDetails, GameStatus } from "@/lib/types";
import type { GameHuntingMeta, GameHuntingOverride } from "@/lib/hunting/hunting.types";

export interface GameHeaderProps {
  readonly game: GameDetails;
  readonly isFavorite: boolean;
  readonly onToggleFavorite: () => void;
  readonly isOwned?: boolean;
  readonly onToggleOwned?: () => void;
  readonly gameStatus?: GameStatus;
  readonly onChangeGameStatus?: (status: GameStatus) => void;
  readonly huntingMeta?: GameHuntingMeta;
  readonly onSaveHuntingOverride?: (override: GameHuntingOverride | undefined) => void;
  readonly onBackToLibrary?: () => void;
}
