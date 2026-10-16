import type {
  PlatformType,
  PlatformAccount,
  OwnedGame,
  UserAccountProfile,
} from "@/lib/types";

interface UsePlatformDbProps {
  accountProfile: UserAccountProfile;
  onAccountChange: (profile: UserAccountProfile) => void;
}

export function usePlatformDb({
  accountProfile,
  onAccountChange,
}: UsePlatformDbProps) {
  const updateAccountProfileInMemory = (
    account: PlatformAccount
  ): UserAccountProfile => {
    const nextProfile: UserAccountProfile = {
      ...accountProfile,
      displayName:
        accountProfile.displayName === "Chasseur de Trophées" &&
        account.displayName
          ? account.displayName
          : accountProfile.displayName,
      avatarUrl: accountProfile.avatarUrl || account.avatarUrl,
      accounts: {
        ...accountProfile.accounts,
        [account.platform]: account,
      },
    };
    onAccountChange(nextProfile);
    return nextProfile;
  };

  const persistAccountToSQLite = async (
    account: PlatformAccount,
    plainApiKey?: string
  ) => {
    try {
      await fetch("/api/user/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account, plainApiKey }),
      });
    } catch (e) {
      console.error("Failed to persist account to SQLite:", e);
    }
  };

  const persistGamesToSQLite = async (
    games: OwnedGame[],
    replacePlatform?: PlatformType
  ) => {
    if ((!games || games.length === 0) && !replacePlatform) return;
    try {
      await fetch("/api/user/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ games, replacePlatform }),
      });
    } catch (e) {
      console.error("Failed to persist games to SQLite:", e);
    }
  };

  const removeAccountFromSQLite = async (platform: PlatformType) => {
    try {
      await fetch(`/api/user/account?platform=${platform}`, {
        method: "DELETE",
      });
    } catch (e) {
      console.error("Failed to remove account from SQLite:", e);
    }
  };

  const removeGameFromSQLite = async (
    appId: number,
    platform?: PlatformType
  ) => {
    try {
      const platParam = platform ? `&platform=${platform}` : "";
      await fetch(`/api/user/games?appId=${appId}${platParam}`, {
        method: "DELETE",
      });
    } catch (e) {
      console.error("Failed to remove game from SQLite:", e);
    }
  };

  return {
    updateAccountProfileInMemory,
    persistAccountToSQLite,
    persistGamesToSQLite,
    removeAccountFromSQLite,
    removeGameFromSQLite,
  };
}
