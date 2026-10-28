// components/dashboard/library/LibraryGameStatusSelector.tsx

import type { GameStatus, OwnedGame, PlatformType } from "@/lib/types";
import { resolveGameStatus } from "@/lib/game-status/game-status.services";
import { GameStatusSelect } from "@/components/game-status/GameStatusSelect";

interface LibraryGameStatusSelectorProps {
  readonly game: OwnedGame;
  readonly onUpdateGameStatus?: (
    appId: number,
    platform: PlatformType,
    status: GameStatus
  ) => Promise<void> | void;
}

export function LibraryGameStatusSelector({
  game,
  onUpdateGameStatus,
}: LibraryGameStatusSelectorProps) {
  return (
    <GameStatusSelect
      status={resolveGameStatus(game.status)}
      onChange={
        onUpdateGameStatus
          ? (status) => onUpdateGameStatus(game.appId, game.platform, status)
          : undefined
      }
      ariaLabel={`Statut de ${game.name}`}
    />
  );
}
