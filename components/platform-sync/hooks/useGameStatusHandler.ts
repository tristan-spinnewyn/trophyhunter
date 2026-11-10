// components/platform-sync/hooks/useGameStatusHandler.ts
import type { GameStatus, OwnedGame, PlatformType } from "@/lib/types";
import { assertValidGameStatus } from "@/lib/game-status/game-status.services";
import { patchOwnedGame } from "./patchOwnedGame";

interface UseGameStatusHandlerProps {
  readonly ownedGames: OwnedGame[];
  readonly onOwnedGamesChange: (games: OwnedGame[]) => void;
}

export function useGameStatusHandler({
  ownedGames,
  onOwnedGamesChange,
}: UseGameStatusHandlerProps) {
  const handleUpdateGameStatus = async (
    appId: number,
    platform: PlatformType,
    status: GameStatus
  ): Promise<void> => {
    const validStatus = assertValidGameStatus(status);
    const next = ownedGames.map((item) =>
      item.appId === appId && item.platform === platform
        ? { ...item, status: validStatus, backlogRank: validStatus === "backlog" ? item.backlogRank : undefined }
        : item
    );
    onOwnedGamesChange(next);

    await patchOwnedGame({ appId, platform, status: validStatus }, "Failed to update game status on the server:");
  };

  return { handleUpdateGameStatus };
}
