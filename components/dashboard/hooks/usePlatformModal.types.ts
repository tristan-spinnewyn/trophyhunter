// components/dashboard/hooks/usePlatformModal.types.ts

import type {
  PlatformType,
  PlatformAccount,
  UserAccountProfile,
} from "@/lib/types";

export interface PlatformFormData {
  username: string;
  displayName: string;
  level: string;
  gamesOwned: string;
  totalAchievements: string;
  completedGames: string;
  hoursPlayed: string;
  gamerScore: string;
  platinum: string;
  gold: string;
  silver: string;
  bronze: string;
}

export interface UsePlatformModalProps {
  accountProfile: UserAccountProfile;
  onAccountChange: (profile: UserAccountProfile) => void;
  onSteamUserChange: (steamUser: string) => void;
  setSteamInput: (val: string) => void;
  setBannerMsg: (
    msg: { type: "success" | "error"; text: string } | null
  ) => void;
  updateAccountProfileInMemory: (account: PlatformAccount) => void;
  persistAccountToSQLite: (account: PlatformAccount) => Promise<void>;
  removeAccountFromSQLite: (platform: PlatformType) => Promise<void>;
  handleConnectAndSyncSteam: (targetUser?: string) => Promise<void>;
}
