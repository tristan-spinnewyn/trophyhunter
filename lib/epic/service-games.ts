// lib/epic/service-games.ts
import type { OwnedGame } from "@/lib/types";
import { resolveEpicCodename, isUnsplashPlaceholder, DEFAULT_EPIC_COVER } from "@/lib/epic-codenames";
import { isJunkHex, hashCode, extractBestCover, normalizeTitle } from "./helpers";
import { fetchEpicLibraryItems } from "./library";
import { batchResolveCatalogTitlesAndImages } from "./catalog";

export async function discoverEpicGames(
  accessToken: string,
  accountId: string,
  nowIso: string
): Promise<{ discoveredGames: OwnedGame[]; gameNamespaceMap: Map<number, string> }> {
  const rawItems = await fetchEpicLibraryItems(accessToken, accountId);
  const namespaceMap = new Map<string, string[]>();

  for (const item of rawItems) {
    const appName = item.appName || "";
    if (appName.startsWith("UE_") || appName.includes("Prerequisites") || appName.includes("DirectX")) continue;

    const meta = item.metadata || {};
    const catId = item.catalogItemId || meta.catalogItemId || "";
    const ns = item.catalogNamespace || item.namespace || meta.catalogNamespace || meta.namespace || item.sandboxId || meta.sandboxId || meta.customAttributes?.SandboxId?.value || "";
    const existingTitle = meta.title || meta.itemName || meta.displayName || item.title || item.name || item.displayName || resolveEpicCodename(appName) || "";
    const hasGoodTitle = existingTitle && !isJunkHex(existingTitle);
    const hasGoodCover = !!extractBestCover(meta.keyImages || item.keyImages || meta.images || item.images, meta.customAttributes);

    if (ns && catId && (!hasGoodTitle || !hasGoodCover)) {
      const list = namespaceMap.get(ns) || [];
      if (!list.includes(catId)) {
        list.push(catId);
        namespaceMap.set(ns, list);
      }
    }
  }

  const catalogTitles = await batchResolveCatalogTitlesAndImages(namespaceMap, accessToken);
  const discoveredGames: OwnedGame[] = [];
  const gameNamespaceMap = new Map<number, string>();
  const seenGameKeys = new Set<string>();

  for (const item of rawItems) {
    const appName = item.appName || "";
    const meta = item.metadata || {};
    if (appName.startsWith("UE_") || appName.includes("Prerequisites") || appName.includes("DirectX") || meta.mainGameItem === false) continue;

    const catId = item.catalogItemId || meta.catalogItemId || "";
    const catalogInfo = catId ? catalogTitles.get(catId) : undefined;
    let gameTitle = catalogInfo?.title || meta.title || meta.itemName || meta.displayName || item.title || item.name || item.displayName || resolveEpicCodename(appName) || "";
    if (!gameTitle && appName && !isJunkHex(appName)) gameTitle = appName.replace(/([A-Z])/g, " $1").trim();
    if (!gameTitle || isJunkHex(gameTitle)) continue;

    const coverUrl = catalogInfo?.image || extractBestCover(meta.keyImages || item.keyImages || meta.images || item.images, meta.customAttributes) || item.headerImg || DEFAULT_EPIC_COVER;
    const idNum = Math.abs(hashCode(catId || appName || gameTitle));
    const normKey = normalizeTitle(gameTitle);

    if (seenGameKeys.has(normKey)) {
      const existing = discoveredGames.find((g) => normalizeTitle(g.name) === normKey);
      if (existing && coverUrl && isUnsplashPlaceholder(existing.headerImg)) existing.headerImg = coverUrl;
      continue;
    }
    seenGameKeys.add(normKey);

    const ns = item.catalogNamespace || item.namespace || meta.catalogNamespace || meta.namespace || item.sandboxId || meta.sandboxId || meta.customAttributes?.SandboxId?.value || "";
    if (ns) gameNamespaceMap.set(idNum, ns.toLowerCase());

    discoveredGames.push({
      appId: idNum, name: gameTitle, headerImg: coverUrl, platform: "epic",
      totalAchievements: 0, unlockedCount: 0, addedAt: nowIso, source: "manual",
    });
  }

  return { discoveredGames, gameNamespaceMap };
}
