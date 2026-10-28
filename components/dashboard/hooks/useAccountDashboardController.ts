// components/dashboard/hooks/useAccountDashboardController.ts
import { useState } from "react";
import type { PlatformType, UserAccountProfile, OwnedGame, User as UserType } from "@/lib/types";
import { usePlatformInputs } from "./usePlatformInputs";
import { usePlatformSync } from "./usePlatformSync";
import { useDashboardStats } from "./useDashboardStats";

/** The accounts page shows either the overview of all platforms or one platform's connection panel. */
export type AccountTab = PlatformType | "all";

export interface AccountDashboardControllerParams {
  accountProfile: UserAccountProfile;
  ownedGames: OwnedGame[];
  onAccountChange: (profile: UserAccountProfile) => void;
  onOwnedGamesChange: (games: OwnedGame[]) => void;
  onSelectGame: (appId: number) => void;
  onSteamUserChange: (steamUser: string) => void;
  currentUser?: UserType | null;
  initialSteamApiKey?: string;
}

export function useAccountDashboardController(params: AccountDashboardControllerParams) {
  const {
    accountProfile, ownedGames, onAccountChange, onOwnedGamesChange,
    onSteamUserChange, currentUser, initialSteamApiKey = "",
  } = params;

  const steamAccount = accountProfile.accounts.steam;
  const [bannerMsg, setBannerMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activePlatformTab, setActivePlatformTab] = useState<AccountTab>("all");

  const platformInputs = usePlatformInputs({ accountProfile, initialSteamApiKey });
  const platformSync = usePlatformSync({
    accountProfile, ownedGames, onAccountChange, onOwnedGamesChange, onSteamUserChange, currentUser, setBannerMsg,
    steamInput: platformInputs.steamInput, setSteamInput: platformInputs.setSteamInput,
    steamApiKey: platformInputs.steamApiKey, xboxInput: platformInputs.xboxInput,
    xboxApiKey: platformInputs.xboxApiKey, epicInput: platformInputs.epicInput,
    epicCode: platformInputs.epicCode, setEpicCode: platformInputs.setEpicCode,
    gogInput: platformInputs.gogInput, gogToken: platformInputs.gogToken,
  });

  const stats = useDashboardStats(ownedGames);
  const displayName = steamAccount?.displayName || steamAccount?.username || "Joueur Steam";

  return {
    bannerMsg, setBannerMsg, activePlatformTab, handleSelectTab: setActivePlatformTab, displayName,
    steamAccount, platformInputs, platformSync, stats,
  };
}

/** What each accounts-page section receives: the controller state and the page's own props. */
export interface DashboardSectionProps {
  readonly controller: ReturnType<typeof useAccountDashboardController>;
  readonly props: AccountDashboardControllerParams;
}
