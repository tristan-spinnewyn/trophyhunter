// context/useUserDataState.ts

import { useState, useEffect } from "react";
import type { UserAccountProfile, OwnedGame, User as UserType } from "@/lib/types";
import type { LocalCollection } from "@/lib/storage";
import {
  fetchRemoteUserData,
  persistGameToServer,
  type SyncResponsePayload,
} from "./useUserDataSync";

export function useUserDataState() {
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

  const applySyncData = (syncData: SyncResponsePayload) => {
    if (Array.isArray(syncData?.games)) setOwnedGames(syncData.games);
    if (syncData?.profile) {
      setAccountProfile(syncData.profile);
      if (syncData.profile.accounts?.steam?.username) {
        setSteamUser(syncData.profile.accounts.steam.username);
      }
    }
    if (typeof syncData?.steamApiKey === "string") setSteamApiKey(syncData.steamApiKey);
    if (Array.isArray(syncData?.favorites)) setFavorites(syncData.favorites);
    if (Array.isArray(syncData?.wishlist)) setWishlistIds(syncData.wishlist);
    if (Array.isArray(syncData?.collections)) {
      setCollections(
        syncData.collections.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description || "",
          color: c.color || "#6366f1",
          gameIds: Array.isArray(c.gameIds) ? c.gameIds : [],
        }))
      );
    }
  };

  const refreshUserData = () => fetchRemoteUserData(applySyncData);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then(async (data) => {
        if (data?.user) {
          setCurrentUser(data.user);
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
    } catch (e) {
      console.error("Logout error:", e);
    }
    setCurrentUser(null);
    setOwnedGames([]);
    setAccountProfile({ displayName: "Chasseur de Trophées", accounts: {} });
    setFavorites([]);
    setWishlistIds([]);
    setCollections([]);
    setSteamUser("");
    setSteamApiKey("");
  };

  const handleAuthSuccess = async (u: UserType) => {
    setCurrentUser(u);
    await refreshUserData();
  };

  const upsertOwnedGameInMemoryAndDb = async (updatedGame: OwnedGame) => {
    setOwnedGames((prev) => {
      const idx = prev.findIndex(
        (g) => g.appId === updatedGame.appId && g.platform === updatedGame.platform
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
          status: updatedGame.status ?? next[idx].status ?? "backlog",
        };
        return next;
      }
      return [{ ...updatedGame, status: updatedGame.status ?? "backlog" }, ...prev];
    });
    await persistGameToServer(currentUser, updatedGame);
  };

  return {
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
    handleLogout,
    handleAuthSuccess,
    upsertOwnedGameInMemoryAndDb,
  };
}
