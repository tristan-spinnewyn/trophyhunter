// components/platform-sync/hooks/usePlatformModal.types.ts

import type {
  PlatformType,
  PlatformAccount,
  UserAccountProfile,
} from "@/lib/types";

export interface UsePlatformModalProps {
  accountProfile: UserAccountProfile;
  onAccountChange: (profile: UserAccountProfile) => void;
  onSteamUserChange: (steamUser: string) => void;
  setSteamInput: (val: string) => void;
  setBannerMsg: (
    msg: { type: "success" | "error"; text: string } | null
  ) => void;
  updateAccountProfileInMemory: (account: PlatformAccount) => void;
  persistAccount: (account: PlatformAccount) => Promise<void>;
  removeAccount: (platform: PlatformType) => Promise<void>;
  handleConnectAndSyncSteam: (targetUser?: string) => Promise<void>;
}
