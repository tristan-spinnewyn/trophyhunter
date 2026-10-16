// lib/storage/account.ts
import type { UserAccountProfile, PlatformAccount, PlatformType } from "../types";
import { ACCOUNT_KEY, STEAM_USER_KEY } from "./constants";
import { getSavedSteamUser, saveSteamUser } from "./crypto";

export function getUserAccount(): UserAccountProfile {
  if (typeof window === "undefined") {
    return { displayName: "Chasseur de Trophées", accounts: {} };
  }
  try {
    const raw = localStorage.getItem(ACCOUNT_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("Failed to read user account:", e);
  }
  const defaultSteam = getSavedSteamUser();
  return {
    displayName: "Chasseur de Trophées",
    accounts: defaultSteam
      ? {
          steam: {
            platform: "steam",
            username: defaultSteam,
            displayName: defaultSteam,
            connectedAt: new Date().toISOString(),
            stats: {
              gamesOwned: 0,
              totalAchievements: 0,
              completedGames: 0,
            },
          },
        }
      : {},
  };
}

export function saveUserAccount(profile: UserAccountProfile): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify(profile));
    if (profile.accounts.steam?.username) {
      saveSteamUser(profile.accounts.steam.username);
    }
  } catch (e) {
    console.error("Failed to save user account:", e);
  }
}

export function savePlatformAccount(account: PlatformAccount): UserAccountProfile {
  const current = getUserAccount();
  const updated: UserAccountProfile = {
    ...current,
    displayName:
      account.platform === "steam" && account.displayName
        ? account.displayName
        : current.displayName,
    avatarUrl:
      account.platform === "steam" && account.avatarUrl
        ? account.avatarUrl
        : current.avatarUrl,
    accounts: {
      ...current.accounts,
      [account.platform]: account,
    },
  };
  saveUserAccount(updated);
  return updated;
}

export function removePlatformAccount(platform: PlatformType): UserAccountProfile {
  const current = getUserAccount();
  const nextAccounts = { ...current.accounts };
  delete nextAccounts[platform];
  if (platform === "steam") {
    localStorage.removeItem(STEAM_USER_KEY);
  }
  const updated: UserAccountProfile = {
    ...current,
    accounts: nextAccounts,
  };
  saveUserAccount(updated);
  return updated;
}
