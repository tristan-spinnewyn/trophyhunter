// components/platform-sync/hooks/useBacklogOrderHandler.ts
import type { OwnedGame, PlatformType } from "@/lib/types";
import { resolveGameStatus } from "@/lib/game-status/game-status.services";
import { mergeWithHiddenQueue, rankToPlayNext } from "@/lib/library/backlog-order";
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

  /** Saves the queue dragged on the backlog shelf; `visibleShelf` is what the shelf showed, filters applied. */
  const handleReorderQueue = async (visibleShelf: readonly OwnedGame[], visibleQueue: readonly OwnedGame[]): Promise<void> => {
    const backlog = ownedGames.filter((g) => resolveGameStatus(g.status) === "backlog");
    const queue = mergeWithHiddenQueue(backlog, visibleShelf, visibleQueue);
    const rankByKey = new Map(queue.map((g, rank) => [`${g.platform}_${g.appId}`, rank]));
    onOwnedGamesChange(ownedGames.map((g) => ({ ...g, backlogRank: rankByKey.get(`${g.platform}_${g.appId}`) })));
    const backlogQueue = queue.map(({ appId, platform }) => ({ appId, platform }));
    await patchOwnedGame({ backlogQueue }, "Failed to save the backlog order on the server:");
  };

  return { handlePlayNext, handleRemoveFromQueue, handleReorderQueue };
}
