// app/game/[id]/hooks/useOwnedGamePatch.ts
"use client";

import type { Dispatch, SetStateAction } from "react";
import type { OwnedGame, User } from "@/lib/types";

export interface UseOwnedGamePatchProps {
  readonly owned: OwnedGame | undefined;
  readonly currentUser: User | null;
  readonly setOwnedGames: Dispatch<SetStateAction<OwnedGame[]>>;
}

/**
 * Changes fields of the page's game: shown at once, saved through PATCH /api/user/games
 * for a signed-in user, and put back as they were if the save fails.
 */
export function useOwnedGamePatch({ owned, currentUser, setOwnedGames }: UseOwnedGamePatchProps) {
  const applyToOwned = (fields: Partial<OwnedGame>) =>
    setOwnedGames((prev) =>
      prev.map((g) => (g.appId === owned?.appId && g.platform === owned?.platform ? { ...g, ...fields } : g))
    );

  /** `fields` is the in-memory change, `body` what the API receives besides the game's id. */
  return async (fields: Partial<OwnedGame>, body: Record<string, unknown>): Promise<void> => {
    if (!owned) return;
    const previous = Object.fromEntries(
      Object.keys(fields).map((key) => [key, owned[key as keyof OwnedGame]])
    ) as Partial<OwnedGame>;
    applyToOwned(fields);
    if (!currentUser) return;

    try {
      const res = await fetch("/api/user/games", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId: owned.appId, platform: owned.platform, ...body }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (error) {
      console.error("Failed to save the game:", error);
      applyToOwned(previous);
    }
  };
}
