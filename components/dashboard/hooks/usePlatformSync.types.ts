// components/dashboard/hooks/usePlatformSync.types.ts

import type {
  OwnedGame,
  UserAccountProfile,
  User as UserType,
} from "@/lib/types";

export interface UsePlatformSyncProps {
  accountProfile: UserAccountProfile;
  ownedGames: OwnedGame[];
  onAccountChange: (profile: UserAccountProfile) => void;
  onOwnedGamesChange: (games: OwnedGame[]) => void;
  onSteamUserChange: (steamUser: string) => void;
  currentUser?: UserType | null;
  setBannerMsg: (
    msg: { type: "success" | "error"; text: string } | null
  ) => void;
  steamInput: string;
  setSteamInput: (val: string) => void;
  steamApiKey: string;
  xboxInput: string;
  xboxApiKey: string;
  epicInput: string;
  epicCode: string;
  setEpicCode: (val: string) => void;
  gogInput: string;
  gogToken: string;
}
