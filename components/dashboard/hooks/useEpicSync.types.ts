// components/dashboard/hooks/useEpicSync.types.ts

import type { OwnedGame, PlatformAccount } from "@/lib/types";

export interface UseEpicSyncProps {
  ownedGames: OwnedGame[];
  onOwnedGamesChange: (games: OwnedGame[]) => void;
  setBannerMsg: (
    msg: { type: "success" | "error"; text: string } | null
  ) => void;
  setSyncProgressText: (text: string | null) => void;
  epicInput: string;
  epicCode: string;
  setEpicCode: (val: string) => void;
  updateAccountProfileInMemory: (account: PlatformAccount) => void;
  persistAccountToSQLite: (account: PlatformAccount) => Promise<void>;
  persistGamesToSQLite: (
    games: OwnedGame[],
    replacePlatform?: "epic"
  ) => Promise<void>;
  onRequireToken?: () => void;
}
