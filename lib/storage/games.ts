// lib/storage/games.ts
import type { OwnedGame, PlatformType } from "../types";
import { resolveEpicCodename } from "../epic-codenames";
import { isValidGameStatus, resolveGameStatus } from "../game-status/game-status.services";
import { OWNED_GAMES_KEY } from "./constants";
import { getGameProgress } from "./progress";

function sortOwnedGames(list: OwnedGame[]): OwnedGame[] {
  return list.sort((a, b) => {
    const pctA = a.totalAchievements > 0 ? a.unlockedCount / a.totalAchievements : 0;
    const pctB = b.totalAchievements > 0 ? b.unlockedCount / b.totalAchievements : 0;
    return pctB !== pctA ? pctB - pctA : a.name.localeCompare(b.name, "fr");
  });
}

export function getOwnedGames(): OwnedGame[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(OWNED_GAMES_KEY);
    if (!raw) return [];
    let mutated = false;
    const resolved = (JSON.parse(raw) as OwnedGame[]).map((g) => {
      const prog = getGameProgress(g.appId);
      const localUnlocked = prog.unlockedIds.length;
      let name = g.name;
      if (g.platform === "epic") {
        const res = resolveEpicCodename(g.name);
        if (res && res !== g.name) { name = res; mutated = true; }
      }
      return {
        ...g, name,
        unlockedCount: localUnlocked > 0 ? localUnlocked : g.unlockedCount,
        lastPlayed: prog.lastPlayed || g.lastPlayed,
        status: resolveGameStatus(g.status),
      };
    });
    if (mutated) saveOwnedGames(resolved);
    return resolved;
  } catch {
    return [];
  }
}

export function saveOwnedGames(games: OwnedGame[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(OWNED_GAMES_KEY, JSON.stringify(games));
  } catch (e) {
    console.error("Failed to save owned games:", e);
  }
}

export function upsertOwnedGames(newGames: OwnedGame[]): OwnedGame[] {
  const current = getOwnedGames();
  const map = new Map<string, OwnedGame>();
  for (const g of current) map.set(`${g.platform}_${g.appId}`, g);

  for (const g of newGames) {
    const key = `${g.platform}_${g.appId}`;
    const existing = map.get(key);
    const localCount = getGameProgress(g.appId).unlockedIds.length;
    const status = isValidGameStatus(g.status) ? g.status : resolveGameStatus(existing?.status);

    map.set(key, {
      ...existing, ...g,
      totalAchievements: g.totalAchievements || existing?.totalAchievements || 0,
      unlockedCount: Math.max(g.unlockedCount || 0, existing?.unlockedCount || 0, localCount),
      playtimeHours: g.playtimeHours ?? existing?.playtimeHours,
      addedAt: existing?.addedAt || g.addedAt || new Date().toISOString(),
      status,
    });
  }

  const merged = sortOwnedGames(Array.from(map.values()));
  saveOwnedGames(merged);
  return merged;
}

export function removeOwnedGame(appId: number, platform?: PlatformType): OwnedGame[] {
  const filtered = getOwnedGames().filter((g) => platform ? !(g.appId === appId && g.platform === platform) : g.appId !== appId);
  saveOwnedGames(filtered);
  return filtered;
}

export function removePlatformOwnedGames(platform: PlatformType): OwnedGame[] {
  const filtered = getOwnedGames().filter((g) => g.platform !== platform);
  saveOwnedGames(filtered);
  return filtered;
}

export function replacePlatformOwnedGames(platform: PlatformType, newGames: OwnedGame[]): OwnedGame[] {
  const current = getOwnedGames();
  const prevByApp = new Map(current.filter((g) => g.platform === platform).map((g) => [g.appId, g]));
  const others = current.filter((g) => g.platform !== platform);
  const normalized = newGames.map((g) => ({
    ...g,
    status: isValidGameStatus(g.status) ? g.status : resolveGameStatus(prevByApp.get(g.appId)?.status),
  }));
  const combined = sortOwnedGames([...others, ...normalized]);
  saveOwnedGames(combined);
  return combined;
}

export function isGameOwned(appId: number): boolean {
  return getOwnedGames().some((g) => g.appId === appId);
}
