import type { Achievement } from "@/lib/types";
import { isLikelyMissable } from "@/lib/steam/game-details";
import { fetchEpicLibraryItems } from "./library";
import { hashCode, normalizeTitle } from "./helpers";
import { EpicAuthError } from "./credentials";

const EPIC_GRAPHQL_ENDPOINTS = [
  "https://graphql.epicgames.com/graphql",
  "https://launcher.store.epicgames.com/graphql",
];

const EPIC_USER_AGENT = "EpicGamesLauncher/14.0.8-22004686+++Portal+Release-Live";

const PRODUCT_ACHIEVEMENTS_QUERY = `query ProductAchievementsBySandbox($sandboxId: String!, $locale: String!) {
  Achievement {
    productAchievementsRecordBySandbox(sandboxId: $sandboxId, locale: $locale) {
      totalAchievements
      achievements {
        achievement {
          name
          hidden
          unlockedDisplayName
          lockedDisplayName
          unlockedDescription
          lockedDescription
          unlockedIconLink
          lockedIconLink
          XP
          rarity { percent }
        }
      }
    }
  }
}`;

const PLAYER_ACHIEVEMENTS_QUERY = `query PlayerAchievementBySandbox($epicAccountId: String!, $sandboxId: String!) {
  PlayerAchievement {
    playerAchievementGameRecordsBySandbox(epicAccountId: $epicAccountId, sandboxId: $sandboxId) {
      records {
        totalUnlocked
        playerAchievements {
          playerAchievement {
            achievementName
            unlocked
            unlockDate
          }
        }
      }
    }
  }
}`;

/** Executes a query against Epic's GraphQL gateway. Throws EpicAuthError on 401/403. */
export async function epicGraphQL<T = any>(
  query: string,
  variables: Record<string, unknown>,
  accessToken: string
): Promise<T | null> {
  for (const endpoint of EPIC_GRAPHQL_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "User-Agent": EPIC_USER_AGENT,
        },
        body: JSON.stringify({ query, variables }),
      });
      if (res.status === 401 || res.status === 403) {
        throw new EpicAuthError();
      }
      if (!res.ok) continue;
      const json = await res.json();
      if (json?.data) return json.data as T;
    } catch (err) {
      if (err instanceof EpicAuthError) throw err;
      // Network error: try next endpoint
    }
  }
  return null;
}

/** Epic returns either `{ playerAchievement: {...} }` wrappers or flat objects. */
export function unwrapPlayerAchievement(entry: any): {
  achievementName: string;
  unlocked: boolean;
} {
  const p = entry?.playerAchievement ?? entry ?? {};
  return {
    achievementName: String(p.achievementName || ""),
    unlocked: Boolean(p.unlocked),
  };
}

export function epicAchievementId(name: string): string {
  return `epic_${name.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 60)}`;
}

export async function fetchEpicProductAchievements(
  sandboxId: string,
  accessToken: string,
  locale = "fr"
): Promise<Array<Achievement & { epicName: string }>> {
  const data = await epicGraphQL(
    PRODUCT_ACHIEVEMENTS_QUERY,
    { sandboxId, locale },
    accessToken
  );
  const list: any[] =
    data?.Achievement?.productAchievementsRecordBySandbox?.achievements || [];

  return list
    .map((entry) => entry?.achievement ?? entry)
    .filter((a) => a?.name)
    .map((a) => {
      const name = a.unlockedDisplayName || a.lockedDisplayName || a.name;
      const hidden = Boolean(a.hidden);
      const desc =
        a.unlockedDescription ||
        a.lockedDescription ||
        (hidden ? "Succès secret (Masqué par le jeu)" : "");
      return {
        id: epicAchievementId(a.name),
        epicName: String(a.name),
        name,
        desc,
        icon: a.unlockedIconLink || a.lockedIconLink || "",
        percent: Number(a.rarity?.percent) || 0,
        hidden,
        missable: isLikelyMissable(name, desc),
      };
    });
}

export async function fetchEpicPlayerUnlockedNames(
  accountId: string,
  sandboxId: string,
  accessToken: string
): Promise<{ unlockedNames: Set<string>; totalUnlocked: number }> {
  const data = await epicGraphQL(
    PLAYER_ACHIEVEMENTS_QUERY,
    { epicAccountId: accountId, sandboxId },
    accessToken
  );
  const records: any[] =
    data?.PlayerAchievement?.playerAchievementGameRecordsBySandbox?.records || [];

  const unlockedNames = new Set<string>();
  let totalUnlocked = 0;
  for (const rec of records) {
    totalUnlocked = Math.max(totalUnlocked, Number(rec?.totalUnlocked) || 0);
    for (const entry of rec?.playerAchievements || []) {
      const p = unwrapPlayerAchievement(entry);
      if (p.unlocked && p.achievementName) unlockedNames.add(p.achievementName);
    }
  }
  return { unlockedNames, totalUnlocked: Math.max(totalUnlocked, unlockedNames.size) };
}

/**
 * Finds the sandboxId (catalog namespace) of an Epic game in the user's library,
 * matching on the same hashed appId used at import time, or on the title.
 */
export async function resolveEpicSandboxId(
  appId: number,
  gameName: string,
  accessToken: string
): Promise<string | null> {
  const items = await fetchEpicLibraryItems(accessToken);
  const targetTitle = normalizeTitle(gameName || "");

  let titleMatch: string | null = null;
  for (const item of items) {
    const meta = item?.metadata || {};
    const ns =
      item.catalogNamespace ||
      item.namespace ||
      meta.catalogNamespace ||
      meta.namespace ||
      item.sandboxId ||
      meta.sandboxId ||
      "";
    if (!ns) continue;

    const catId = item.catalogItemId || meta.catalogItemId || "";
    const appName = item.appName || "";
    const title = meta.title || item.title || item.displayName || "";

    const candidates = [catId, appName, title].filter(Boolean);
    if (candidates.some((c) => Math.abs(hashCode(c)) === appId)) {
      return String(ns);
    }
    if (!titleMatch && targetTitle && title && normalizeTitle(title) === targetTitle) {
      titleMatch = String(ns);
    }
  }
  return titleMatch;
}

export interface EpicGameAchievementData {
  sandboxId: string;
  achievements: Achievement[];
  unlockedIds: string[];
  unlockedTitles: string[];
  totalUnlocked: number;
}

/**
 * Fetches the full achievement list of an Epic game (names, descriptions, icons,
 * rarity) together with the player's unlocked achievements.
 */
export async function getEpicGameAchievements(params: {
  appId: number;
  gameName: string;
  accessToken: string;
  accountId: string;
  sandboxId?: string | null;
}): Promise<EpicGameAchievementData | null> {
  const { appId, gameName, accessToken, accountId } = params;
  const sandboxId =
    params.sandboxId || (await resolveEpicSandboxId(appId, gameName, accessToken));
  if (!sandboxId) return null;

  const [product, player] = await Promise.all([
    fetchEpicProductAchievements(sandboxId, accessToken),
    fetchEpicPlayerUnlockedNames(accountId, sandboxId, accessToken),
  ]);

  if (product.length === 0 && player.totalUnlocked === 0) {
    return { sandboxId, achievements: [], unlockedIds: [], unlockedTitles: [], totalUnlocked: 0 };
  }

  const unlocked = product.filter((a) => player.unlockedNames.has(a.epicName));
  const achievements: Achievement[] = product;

  return {
    sandboxId,
    achievements,
    unlockedIds: unlocked.map((a) => a.id),
    unlockedTitles: unlocked.map((a) => a.name),
    totalUnlocked: Math.max(player.totalUnlocked, unlocked.length),
  };
}
