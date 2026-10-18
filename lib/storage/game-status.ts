// lib/storage/game-status.ts
import type { GameStatus, OwnedGame, PlatformType } from "../types";
import { assertValidGameStatus } from "../game-status/game-status.services";
import { getOwnedGames, saveOwnedGames } from "./games";

export function updateOwnedGameStatus(
  appId: number,
  platform: PlatformType,
  status: GameStatus
): OwnedGame[] {
  const validStatus = assertValidGameStatus(status);
  const current = getOwnedGames();
  const updated = current.map((g) =>
    g.appId === appId && g.platform === platform
      ? { ...g, status: validStatus }
      : g
  );
  saveOwnedGames(updated);
  return updated;
}
