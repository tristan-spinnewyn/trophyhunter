// components/platform-sync/hooks/patchOwnedGame.ts
import type { GameStatus, PlatformType } from "@/lib/types";

type OwnedGamePatch =
  | { readonly appId: number; readonly platform: PlatformType; readonly status: GameStatus }
  | { readonly appId: number; readonly platform: PlatformType; readonly backlogRank: number | null }
  | { readonly backlogQueue: readonly { readonly appId: number; readonly platform: PlatformType }[] };

/** Sends one tracking change of a game to the server. The caller has already applied it in memory. */
export async function patchOwnedGame(patch: OwnedGamePatch, failureLog: string): Promise<void> {
  try {
    await fetch("/api/user/games", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  } catch (e) {
    console.error(failureLog, e);
  }
}
