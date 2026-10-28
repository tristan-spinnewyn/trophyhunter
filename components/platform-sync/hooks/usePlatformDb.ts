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

  const persistAccount = async (
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
      console.error("Failed to persist account on the server:", e);
    }
  };

  const persistGames = async (
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
      console.error("Failed to persist games on the server:", e);
    }
  };

  const removeAccount = async (platform: PlatformType) => {
    try {
      await fetch(`/api/user/account?platform=${platform}`, {
        method: "DELETE",
      });
    } catch (e) {
      console.error("Failed to remove account on the server:", e);
    }
  };

  const removeGame = async (
    appId: number,
    platform?: PlatformType
  ) => {
    try {
      const platParam = platform ? `&platform=${platform}` : "";
      await fetch(`/api/user/games?appId=${appId}${platParam}`, {
        method: "DELETE",
      });
    } catch (e) {
      console.error("Failed to remove game on the server:", e);
    }
  };

  return {
    updateAccountProfileInMemory,
    persistAccount,
    persistGames,
    removeAccount,
    removeGame,
  };
}
