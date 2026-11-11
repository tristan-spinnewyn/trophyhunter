// components/library/hooks/useGameLinks.ts
"use client";

import type { Dispatch, SetStateAction } from "react";
import type { GameRef, OwnedGame, User } from "@/lib/types";
import { choosePrimaryGame, gameRefKey } from "@/lib/library/linked-games";

interface UseGameLinksProps {
  readonly currentUser: User | null;
  readonly setOwnedGames: Dispatch<SetStateAction<OwnedGame[]>>;
  readonly onError: (message: string) => void;
}

const SAVE_ERROR = "La fusion n'a pas pu être enregistrée.";
const refOf = ({ platform, appId }: GameRef): GameRef => ({ platform, appId });

/** Merges the copies of a game owned on several platforms, or unmerges them: shown at once, saved for a signed-in user. */
export function useGameLinks({ currentUser, setOwnedGames, onError }: UseGameLinksProps) {
  const save = async (method: "POST" | "DELETE", body: Record<string, unknown>, previous: OwnedGame[]) => {
    if (!currentUser) return;
    try {
      const res = await fetch("/api/user/game-links", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (error) {
      console.error("Failed to save the game links:", error);
      setOwnedGames(previous);
      onError(SAVE_ERROR);
    }
  };

  const mergeGames = async (games: readonly OwnedGame[]) => {
    const primary = refOf(choosePrimaryGame(games));
    const copies = games.map(refOf).filter((ref) => gameRefKey(ref) !== gameRefKey(primary));
    const copyKeys = new Set(copies.map(gameRefKey));
    let previous: OwnedGame[] = [];
    setOwnedGames((prev) => {
      previous = prev;
      return prev.map((g) => {
        if (gameRefKey(g) === gameRefKey(primary)) return { ...g, mergedInto: undefined };
        // Copies, and anything merged into a copy, now point at the primary.
        const isMoved = copyKeys.has(gameRefKey(g)) || (g.mergedInto && copyKeys.has(gameRefKey(g.mergedInto)));
        return isMoved ? { ...g, mergedInto: primary } : g;
      });
    });
    await save("POST", { primary, copies }, previous);
  };

  const unmergeGames = async (primaryGame: OwnedGame) => {
    const primaryKey = gameRefKey(primaryGame);
    let previous: OwnedGame[] = [];
    setOwnedGames((prev) => {
      previous = prev;
      return prev.map((g) => (g.mergedInto && gameRefKey(g.mergedInto) === primaryKey ? { ...g, mergedInto: undefined } : g));
    });
    await save("DELETE", { primary: refOf(primaryGame) }, previous);
  };

  return { mergeGames, unmergeGames };
}
