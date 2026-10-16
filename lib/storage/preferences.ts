// lib/storage/preferences.ts
import { FAV_KEY, RECENT_KEY, WISHLIST_KEY } from "./constants";

export function getFavoriteGames(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FAV_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleFavoriteGame(appId: number): number[] {
  const favs = getFavoriteGames();
  const exists = favs.includes(appId);
  const updated = exists ? favs.filter((id) => id !== appId) : [...favs, appId];
  try {
    localStorage.setItem(FAV_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error(e);
  }
  return updated;
}

export function getRecentGames(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addRecentGame(appId: number): void {
  if (typeof window === "undefined") return;
  try {
    const recents = getRecentGames().filter((id) => id !== appId);
    recents.unshift(appId);
    localStorage.setItem(RECENT_KEY, JSON.stringify(recents.slice(0, 10)));
  } catch (e) {
    console.error(e);
  }
}

export function getLocalWishlist(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WISHLIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleLocalWishlist(appId: number): boolean {
  if (typeof window === "undefined") return false;
  const current = getLocalWishlist();
  const exists = current.includes(appId);
  const next = exists ? current.filter((id) => id !== appId) : [...current, appId];
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(next));
  return !exists;
}
