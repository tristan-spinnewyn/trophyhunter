"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import type {
  UserAccountProfile,
  OwnedGame,
  User as UserType,
} from "@/lib/types";
import {
  getSavedSteamApiKey,
  getUserAccount,
  getOwnedGames,
  getFavoriteGames,
  getLocalWishlist,
  getLocalCollections,
  clearLegacyLocalStorage,
  type LocalCollection,
} from "@/lib/storage";

interface UserDataContextType {
  currentUser: UserType | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<UserType | null>>;
  accountProfile: UserAccountProfile;
  setAccountProfile: React.Dispatch<React.SetStateAction<UserAccountProfile>>;
  ownedGames: OwnedGame[];
  setOwnedGames: React.Dispatch<React.SetStateAction<OwnedGame[]>>;
  favorites: number[];
  setFavorites: React.Dispatch<React.SetStateAction<number[]>>;
  wishlistIds: number[];
  setWishlistIds: React.Dispatch<React.SetStateAction<number[]>>;
  collections: LocalCollection[];
  setCollections: React.Dispatch<React.SetStateAction<LocalCollection[]>>;
  steamUser: string;
  setSteamUser: React.Dispatch<React.SetStateAction<string>>;
  steamApiKey: string;
  setSteamApiKey: React.Dispatch<React.SetStateAction<string>>;
  isCheckingAuth: boolean;
  isAuthOpen: boolean;
  setIsAuthOpen: (open: boolean) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  refreshUserData: () => Promise<void>;
  handleSyncLocalToSQLite: () => Promise<void>;
  handleLogout: () => Promise<void>;
  handleAuthSuccess: (u: UserType) => Promise<void>;
  upsertOwnedGameInMemoryAndDb: (g: OwnedGame) => Promise<void>;
}

const UserDataContext = createContext<UserDataContextType | undefined>(
  undefined
);

export function UserDataProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const [steamUser, setSteamUser] = useState<string>("");
  const [steamApiKey, setSteamApiKey] = useState<string>("");
  const [accountProfile, setAccountProfile] = useState<UserAccountProfile>({
    displayName: "Chasseur de Trophées",
    accounts: {},
  });
  const [ownedGames, setOwnedGames] = useState<OwnedGame[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [wishlistIds, setWishlistIds] = useState<number[]>([]);
  const [collections, setCollections] = useState<LocalCollection[]>([]);

  const applySyncData = (syncData: any) => {
    if (Array.isArray(syncData?.games)) {
      setOwnedGames(syncData.games);
    }
    if (syncData?.profile) {
      setAccountProfile(syncData.profile);
      if (syncData.profile.accounts?.steam?.username) {
        setSteamUser(syncData.profile.accounts.steam.username);
      }
    }
    if (typeof syncData?.steamApiKey === "string") {
      setSteamApiKey(syncData.steamApiKey);
    }
    if (Array.isArray(syncData?.favorites)) {
      setFavorites(syncData.favorites);
    }
    if (Array.isArray(syncData?.wishlist)) {
      setWishlistIds(syncData.wishlist);
    }
    if (Array.isArray(syncData?.collections)) {
      setCollections(
        syncData.collections.map((c: any) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          color: c.color || "#6366f1",
          gameIds: Array.isArray(c.gameIds) ? c.gameIds : [],
        }))
      );
    }
  };

  const refreshUserData = async () => {
    try {
      const res = await fetch("/api/user/sync");
      if (!res.ok) return;
      const syncData = await res.json();
      applySyncData(syncData);
    } catch (e) {
      console.error("Failed to refresh user data from SQLite:", e);
    }
  };

  const handleSyncLocalToSQLite = async () => {
    const localProfile = getUserAccount();
    const localGames = getOwnedGames();
    const localFavorites = getFavoriteGames();
    const localWishlist = getLocalWishlist();
    const localCollections = getLocalCollections();
    const localApiKey = getSavedSteamApiKey();
    const progressMap: Record<string, any> = {};
    if (typeof window !== "undefined") {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("trophyhunter_game_")) {
          try {
            progressMap[k] = JSON.parse(localStorage.getItem(k) || "{}");
          } catch {}
        }
      }
    }

    const payload = {
      profile: localProfile,
      games: localGames,
      favorites: localFavorites,
      wishlist: localWishlist,
      collections: localCollections,
      steamApiKey: localApiKey || undefined,
      progress: progressMap,
    };

    const res = await fetch("/api/user/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error("Erreur de synchronisation SQLite");
    }

    const data = await res.json();
    applySyncData(data);
    clearLegacyLocalStorage();
  };

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then(async (data) => {
        if (data?.user) {
          setCurrentUser(data.user);
          try {
            const localGames = getOwnedGames();
            const localAccount = getUserAccount();
            const hasLocalData =
              localGames.length > 0 ||
              (localAccount?.accounts &&
                Object.keys(localAccount.accounts).length > 0);

            if (hasLocalData) {
              await handleSyncLocalToSQLite();
            }
          } catch (e) {
            console.error("Auto-migration check error:", e);
          }
          await refreshUserData();
        } else {
          setCurrentUser(null);
        }
      })
      .catch(() => setCurrentUser(null))
      .finally(() => setIsCheckingAuth(false));
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    setCurrentUser(null);
    setOwnedGames([]);
    setAccountProfile({
      displayName: "Chasseur de Trophées",
      accounts: {},
    });
    setFavorites([]);
    setWishlistIds([]);
    setCollections([]);
    setSteamUser("");
    setSteamApiKey("");
  };

  const handleAuthSuccess = async (u: UserType) => {
    setCurrentUser(u);
    try {
      const localGames = getOwnedGames();
      const localAccount = getUserAccount();
      const hasLocalData =
        localGames.length > 0 ||
        (localAccount?.accounts &&
          Object.keys(localAccount.accounts).length > 0);

      if (hasLocalData) {
        await handleSyncLocalToSQLite();
      }
    } catch (e) {
      console.error("Auto-sync local data to SQLite failed:", e);
    }
    await refreshUserData();
  };

  const upsertOwnedGameInMemoryAndDb = async (updatedGame: OwnedGame) => {
    setOwnedGames((prev) => {
      const idx = prev.findIndex(
        (g) =>
          g.appId === updatedGame.appId && g.platform === updatedGame.platform
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          ...updatedGame,
          totalAchievements:
            updatedGame.totalAchievements > 0
              ? updatedGame.totalAchievements
              : next[idx].totalAchievements,
        };
        return next;
      }
      return [updatedGame, ...prev];
    });

    if (currentUser) {
      try {
        await fetch("/api/user/games", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ game: updatedGame }),
        });
      } catch (e) {
        console.error("Failed to save game to SQLite:", e);
      }
    }
  };

  return (
    <UserDataContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        accountProfile,
        setAccountProfile,
        ownedGames,
        setOwnedGames,
        favorites,
        setFavorites,
        wishlistIds,
        setWishlistIds,
        collections,
        setCollections,
        steamUser,
        setSteamUser,
        steamApiKey,
        setSteamApiKey,
        isCheckingAuth,
        isAuthOpen,
        setIsAuthOpen,
        isSettingsOpen,
        setIsSettingsOpen,
        refreshUserData,
        handleSyncLocalToSQLite,
        handleLogout,
        handleAuthSuccess,
        upsertOwnedGameInMemoryAndDb,
      }}
    >
      {children}
    </UserDataContext.Provider>
  );
}

export function useUserData() {
  const context = useContext(UserDataContext);
  if (!context) {
    throw new Error("useUserData must be used within a UserDataProvider");
  }
  return context;
}
