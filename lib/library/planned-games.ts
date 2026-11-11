// lib/library/planned-games.ts
import type { OwnedGame } from "@/lib/types";
import { resolveGameStatus } from "@/lib/game-status/game-status.services";

/** Games still ahead of the owner: queued in the backlog, being played, or paused to come back to. */
export function isPlannedGame(game: Pick<OwnedGame, "status">): boolean {
  const status = resolveGameStatus(game.status);
  return status === "backlog" || status === "in-progress" || status === "paused";
}
