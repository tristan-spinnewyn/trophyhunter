// components/dashboard/hooks/useGameStatusHandler.ts
import type { GameStatus, OwnedGame, PlatformType } from "@/lib/types";
import { assertValidGameStatus } from "@/lib/game-status/game-status.services";
import { updateOwnedGameStatus } from "@/lib/storage";

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
        ? { ...item, status: validStatus }
        : item
    );
    onOwnedGamesChange(next);
    updateOwnedGameStatus(appId, platform, validStatus);

    try {
      await fetch("/api/user/games", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId, platform, status: validStatus }),
      });
    } catch (e) {
      console.error("Failed to update game status in SQLite:", e);
    }
  };

  return { handleUpdateGameStatus };
}
