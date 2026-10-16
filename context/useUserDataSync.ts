// context/useUserDataSync.ts
import {
  getSavedSteamApiKey,
  getUserAccount,
  getOwnedGames,
  getFavoriteGames,
  getLocalWishlist,
  getLocalCollections,
  clearLegacyLocalStorage,
} from "@/lib/storage";
import type { OwnedGame, User as UserType } from "@/lib/types";

export async function syncLocalDataToSQLite(applySyncData: (data: any) => void): Promise<void> {
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

  if (!res.ok) throw new Error("Erreur de synchronisation SQLite");
  const data = await res.json();
  applySyncData(data);
  clearLegacyLocalStorage();
}

export async function fetchRemoteUserData(applySyncData: (data: any) => void): Promise<void> {
  try {
    const res = await fetch("/api/user/sync");
    if (!res.ok) return;
    const syncData = await res.json();
    applySyncData(syncData);
  } catch (e) {
    console.error("Failed to refresh user data from SQLite:", e);
  }
}

export async function persistGameToSQLite(currentUser: UserType | null, updatedGame: OwnedGame): Promise<void> {
  if (!currentUser) return;
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
