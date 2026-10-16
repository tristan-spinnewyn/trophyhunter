import type {
  UserGameProgress,
  UserAccountProfile,
  PlatformAccount,
  PlatformType,
  OwnedGame,
} from "./types";

const PREFIX = "trophyhunter_game_";
const FAV_KEY = "trophyhunter_favorites";
const RECENT_KEY = "trophyhunter_recent_games";
const STEAM_USER_KEY = "trophyhunter_steam_user";
const STEAM_API_KEY = "trophyhunter_steam_api_key";
const ACCOUNT_KEY = "trophyhunter_user_account";
const OWNED_GAMES_KEY = "trophyhunter_owned_games";

export function normalizeGameTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(
      /\b(game of the year edition|goty edition|definitive edition|director's cut|remastered|enhanced edition|special edition|standard edition|deluxe edition)\b/gi,
      ""
    )
    .replace(/[^a-z0-9]/gi, "")
    .trim();
}


export const PLATFORM_META: Record<
  PlatformType,
  {
    name: string;
    shortName: string;
    placeholder: string;
    badgeClass: string;
    accentColor: string;
    trophyLabel: string;
    completeLabel: string;
    supportsAutoSync: boolean;
  }
> = {
  steam: {
    name: "Steam",
    shortName: "Steam",
    placeholder: "SteamID64 (7656119...), pseudo ou URL du profil",
    badgeClass: "border-sky-500/40 bg-sky-500/10 text-sky-300",
    accentColor: "from-sky-500 to-blue-600",
    trophyLabel: "Succès",
    completeLabel: "Jeux 100%",
    supportsAutoSync: true,
  },
  xbox: {
    name: "Xbox Live",
    shortName: "Xbox",
    placeholder: "Gamertag Xbox (ex: MasterChief#1234)",
    badgeClass: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
    accentColor: "from-emerald-500 to-green-700",
    trophyLabel: "Succès",
    completeLabel: "Jeux 1000G",
    supportsAutoSync: true,
  },
  epic: {
    name: "Epic Games",
    shortName: "Epic",
    placeholder: "Pseudo Exophase ou compte Epic",
    badgeClass: "border-purple-500/40 bg-purple-500/10 text-purple-300",
    accentColor: "from-purple-500 to-fuchsia-700",
    trophyLabel: "Succès Epic",
    completeLabel: "Platines Epic",
    supportsAutoSync: true,
  },
  gog: {
    name: "GOG Galaxy",
    shortName: "GOG",
    placeholder: "Pseudo GOG.com",
    badgeClass: "border-violet-500/40 bg-violet-500/10 text-violet-300",
    accentColor: "from-violet-500 to-purple-800",
    trophyLabel: "Succès",
    completeLabel: "Jeux 100%",
    supportsAutoSync: true,
  },
};

export function getSavedSteamUser(): string {
  if (typeof window === "undefined") return "";
  const saved = localStorage.getItem(STEAM_USER_KEY);
  if (saved !== null) return saved;
  return "";
}

export function saveSteamUser(user: string): void {
  if (typeof window === "undefined") return;
  if (!user.trim()) {
    localStorage.removeItem(STEAM_USER_KEY);
  } else {
    localStorage.setItem(STEAM_USER_KEY, user.trim());
  }
}

const ENC_PREFIX = "enc_v1:";

function encryptSensitiveData(plainText: string): string {
  if (!plainText) return "";
  const salt = 0x5a;
  const chars = Array.from(plainText).map((c, i) =>
    (c.charCodeAt(0) ^ salt ^ ((i * 7) % 255)).toString(16).padStart(2, "0")
  );
  return ENC_PREFIX + chars.join("");
}

function decryptSensitiveData(cipherText: string): string {
  if (!cipherText) return "";
  if (!cipherText.startsWith(ENC_PREFIX)) {
    return cipherText;
  }
  const hex = cipherText.slice(ENC_PREFIX.length);
  const salt = 0x5a;
  let result = "";
  for (let i = 0; i < hex.length; i += 2) {
    const byte = parseInt(hex.slice(i, i + 2), 16);
    const charCode = byte ^ salt ^ (((i / 2) * 7) % 255);
    result += String.fromCharCode(charCode);
  }
  return result;
}

export function getSavedSteamApiKey(): string {
  if (typeof window === "undefined") return "";
  const raw = localStorage.getItem(STEAM_API_KEY) || "";
  return decryptSensitiveData(raw);
}

export function saveSteamApiKey(key: string): void {
  if (typeof window === "undefined") return;
  if (!key.trim()) {
    localStorage.removeItem(STEAM_API_KEY);
  } else {
    localStorage.setItem(STEAM_API_KEY, encryptSensitiveData(key.trim()));
  }
}

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

export function getOwnedGames(): OwnedGame[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(OWNED_GAMES_KEY);
    if (!raw) return [];
    const list: OwnedGame[] = JSON.parse(raw);
    // Keep unlockedCount synchronized with local progress if local progress has more recent data
    return list.map((g) => {
      const prog = getGameProgress(g.appId);
      const localUnlocked = prog.unlockedIds.length;
      return {
        ...g,
        unlockedCount: localUnlocked > 0 ? localUnlocked : g.unlockedCount,
        lastPlayed: prog.lastPlayed || g.lastPlayed,
      };
    });
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

  for (const g of current) {
    map.set(`${g.platform}_${g.appId}`, g);
  }

  for (const g of newGames) {
    const key = `${g.platform}_${g.appId}`;
    const existing = map.get(key);
    const prog = getGameProgress(g.appId);
    const localCount = prog.unlockedIds.length;

    map.set(key, {
      ...existing,
      ...g,
      totalAchievements:
        g.totalAchievements || existing?.totalAchievements || 0,
      unlockedCount: Math.max(
        g.unlockedCount || 0,
        existing?.unlockedCount || 0,
        localCount
      ),
      playtimeHours: g.playtimeHours ?? existing?.playtimeHours,
      addedAt: existing?.addedAt || g.addedAt || new Date().toISOString(),
    });
  }

  const merged = Array.from(map.values()).sort((a, b) => {
    const pctA = a.totalAchievements > 0 ? a.unlockedCount / a.totalAchievements : 0;
    const pctB = b.totalAchievements > 0 ? b.unlockedCount / b.totalAchievements : 0;
    if (pctB !== pctA) return pctB - pctA;
    return a.name.localeCompare(b.name, "fr");
  });

  saveOwnedGames(merged);
  return merged;
}

export function removeOwnedGame(appId: number, platform?: PlatformType): OwnedGame[] {
  const current = getOwnedGames();
  const filtered = current.filter((g) =>
    platform ? !(g.appId === appId && g.platform === platform) : g.appId !== appId
  );
  saveOwnedGames(filtered);
  return filtered;
}

export function removePlatformOwnedGames(platform: PlatformType): OwnedGame[] {
  const current = getOwnedGames();
  const filtered = current.filter((g) => g.platform !== platform);
  saveOwnedGames(filtered);
  return filtered;
}

export function replacePlatformOwnedGames(platform: PlatformType, newGames: OwnedGame[]): OwnedGame[] {
  const current = getOwnedGames();
  const others = current.filter((g) => g.platform !== platform);
  const combined = [...others, ...newGames].sort((a, b) => {
    const pctA = a.totalAchievements > 0 ? a.unlockedCount / a.totalAchievements : 0;
    const pctB = b.totalAchievements > 0 ? b.unlockedCount / b.totalAchievements : 0;
    if (pctB !== pctA) return pctB - pctA;
    return a.name.localeCompare(b.name, "fr");
  });
  saveOwnedGames(combined);
  return combined;
}

export function isGameOwned(appId: number): boolean {
  return getOwnedGames().some((g) => g.appId === appId);
}

export function getGameProgress(appId: number): UserGameProgress {
  if (typeof window === "undefined") {
    return { unlockedIds: [], notes: {} };
  }
  try {
    const raw = localStorage.getItem(`${PREFIX}${appId}`);
    if (!raw) return { unlockedIds: [], notes: {} };
    return JSON.parse(raw);
  } catch {
    return { unlockedIds: [], notes: {} };
  }
}

export function saveGameProgress(
  appId: number,
  progress: UserGameProgress,
  gameMeta?: { name: string; headerImg: string; totalAchievements: number; platform?: PlatformType }
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${PREFIX}${appId}`, JSON.stringify(progress));
    addRecentGame(appId);

    // Update owned game entry if present or if gameMeta is supplied
    const owned = getOwnedGames();
    const idx = owned.findIndex((g) => g.appId === appId);
    if (idx !== -1) {
      owned[idx] = {
        ...owned[idx],
        unlockedCount: progress.unlockedIds.length,
        totalAchievements:
          gameMeta?.totalAchievements || owned[idx].totalAchievements,
        lastPlayed: progress.lastPlayed || new Date().toISOString(),
      };
      saveOwnedGames(owned);
    } else if (gameMeta && progress.unlockedIds.length > 0) {
      upsertOwnedGames([
        {
          appId,
          name: gameMeta.name,
          headerImg: gameMeta.headerImg,
          platform: gameMeta.platform || "steam",
          totalAchievements: gameMeta.totalAchievements,
          unlockedCount: progress.unlockedIds.length,
          lastPlayed: progress.lastPlayed || new Date().toISOString(),
          addedAt: new Date().toISOString(),
          source: "manual",
        },
      ]);
    }
  } catch (err) {
    console.error("Failed to save progress to localStorage:", err);
  }
}

export function toggleAchievementUnlocked(
  appId: number,
  achievementId: string,
  gameMeta?: { name: string; headerImg: string; totalAchievements: number }
): UserGameProgress {
  const current = getGameProgress(appId);
  const exists = current.unlockedIds.includes(achievementId);
  const updatedIds = exists
    ? current.unlockedIds.filter((id) => id !== achievementId)
    : [...current.unlockedIds, achievementId];

  const updated: UserGameProgress = {
    ...current,
    unlockedIds: updatedIds,
    lastPlayed: new Date().toISOString(),
  };

  saveGameProgress(appId, updated, gameMeta);
  return updated;
}

export function setAchievementNote(
  appId: number,
  achievementId: string,
  note: string
): UserGameProgress {
  const current = getGameProgress(appId);
  const updated: UserGameProgress = {
    ...current,
    notes: {
      ...current.notes,
      [achievementId]: note,
    },
  };
  saveGameProgress(appId, updated);
  return updated;
}

export function resetGameProgress(appId: number): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(`${PREFIX}${appId}`);
  const owned = getOwnedGames();
  const idx = owned.findIndex((g) => g.appId === appId);
  if (idx !== -1) {
    owned[idx] = { ...owned[idx], unlockedCount: 0 };
    saveOwnedGames(owned);
  }
}

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

export function exportAllData(): string {
  if (typeof window === "undefined") return "{}";
  const data: Record<string, any> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith("trophyhunter_")) {
      try {
        data[key] = JSON.parse(localStorage.getItem(key) || "null");
      } catch {
        data[key] = localStorage.getItem(key);
      }
    }
  }
  return JSON.stringify(data, null, 2);
}

export function importAllData(jsonStr: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const data = JSON.parse(jsonStr);
    for (const key of Object.keys(data)) {
      if (key.startsWith("trophyhunter_")) {
        const val = typeof data[key] === "object" ? JSON.stringify(data[key]) : data[key];
        localStorage.setItem(key, val);
      }
    }
    return true;
  } catch (e) {
    console.error("Import failed:", e);
    return false;
  }
}

const WISHLIST_KEY = "trophyhunter_wishlist";
const COLLECTIONS_KEY = "trophyhunter_collections";

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

export interface LocalCollection {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  gameIds: number[];
}

export function getLocalCollections(): LocalCollection[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(COLLECTIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalCollections(colls: LocalCollection[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(colls));
}

