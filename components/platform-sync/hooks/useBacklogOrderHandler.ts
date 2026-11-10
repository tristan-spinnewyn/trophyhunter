// components/platform-sync/hooks/useBacklogOrderHandler.ts
import type { OwnedGame, PlatformType } from "@/lib/types";
import { resolveGameStatus } from "@/lib/game-status/game-status.services";
import { rankToPlayNext } from "@/lib/library/backlog-order";
import { patchOwnedGame } from "./patchOwnedGame";

interface UseBacklogOrderHandlerProps {
  readonly ownedGames: OwnedGame[];
  readonly onOwnedGamesChange: (games: OwnedGame[]) => void;
}

/** Orders the backlog as a queue: put a game at its head, or take it out. */
export function useBacklogOrderHandler({ ownedGames, onOwnedGamesChange }: UseBacklogOrderHandlerProps) {
  const setRank = async (appId: number, platform: PlatformType, backlogRank: number | null): Promise<void> => {
    onOwnedGamesChange(
      ownedGames.map((g) =>
        g.appId === appId && g.platform === platform ? { ...g, backlogRank: backlogRank ?? undefined } : g
      )
    );
    await patchOwnedGame({ appId, platform, backlogRank }, "Failed to update the backlog order on the server:");
  };

  const handlePlayNext = (appId: number, platform: PlatformType): Promise<void> => {
    const backlog = ownedGames.filter((g) => resolveGameStatus(g.status) === "backlog");
    return setRank(appId, platform, rankToPlayNext(backlog));
  };

  const handleRemoveFromQueue = (appId: number, platform: PlatformType): Promise<void> =>
    setRank(appId, platform, null);

  return { handlePlayNext, handleRemoveFromQueue };
}
