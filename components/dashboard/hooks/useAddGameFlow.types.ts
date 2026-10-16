// components/dashboard/hooks/useAddGameFlow.types.ts

import type { OwnedGame, PlatformType, GameSearchResult } from "@/lib/types";

export interface UseAddGameFlowProps {
  ownedGames: OwnedGame[];
  onOwnedGamesChange: (games: OwnedGame[]) => void;
  steamUsername?: string;
  syncSingleSteamGame: (
    steamUsername: string,
    game: OwnedGame
  ) => Promise<OwnedGame>;
  persistGamesToSQLite: (games: OwnedGame[]) => Promise<void>;
  setBannerMsg: (
    msg: { type: "success" | "error"; text: string } | null
  ) => void;
}

export type { PlatformType, GameSearchResult };
