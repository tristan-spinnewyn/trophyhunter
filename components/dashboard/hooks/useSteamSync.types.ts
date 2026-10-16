// components/dashboard/hooks/useSteamSync.types.ts

import type {
  OwnedGame,
  PlatformAccount,
  User as UserType,
} from "@/lib/types";

export interface UseSteamSyncProps {
  ownedGames: OwnedGame[];
  onOwnedGamesChange: (games: OwnedGame[]) => void;
  onSteamUserChange: (steamUser: string) => void;
  currentUser?: UserType | null;
  setBannerMsg: (
    msg: { type: "success" | "error"; text: string } | null
  ) => void;
  setSyncProgressText: (text: string | null) => void;
  steamInput: string;
  steamApiKey: string;
  updateAccountProfileInMemory: (account: PlatformAccount) => void;
  persistAccountToSQLite: (
    account: PlatformAccount,
    plainApiKey?: string
  ) => Promise<void>;
  persistGamesToSQLite: (games: OwnedGame[]) => Promise<void>;
}
