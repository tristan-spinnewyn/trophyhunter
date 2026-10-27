// lib/epic/library.ts
import type { OwnedGame } from "@/lib/types";
import {
  DEFAULT_EPIC_COVER,
  extractBestCover,
  hashCode,
  isJunkHex,
  isUnsplashPlaceholder,
  normalizeTitle,
  resolveEpicCodename,
} from "./game-metadata";

const USER_AGENT = "UELauncher/11.0.1-14907503+++Portal+Release-Live Windows/10.0.19041.1.256.64bit";

export async function fetchLibraryServiceItems(accessToken: string): Promise<any[]> {
  const records: any[] = [];
  try {
    const libraryRes = await fetch(
      "https://library-service.live.use1a.on.epicgames.com/library/api/public/items?includeMetadata=true",
      { headers: { Authorization: `Bearer ${accessToken}`, "User-Agent": USER_AGENT } }
    );
    if (!libraryRes.ok) return [];

    const libData = await libraryRes.json();
    if (Array.isArray(libData)) records.push(...libData);
    else if (Array.isArray(libData?.records)) records.push(...libData.records);

    let nextCursor = libData?.responseMetadata?.nextCursor || libData?.nextCursor || libData?.cursor;
    let pageCount = 0;
    const MAX_PAGES = 50;

    while (nextCursor && pageCount < MAX_PAGES) {
      pageCount++;
      try {
        const cursorParam = nextCursor.includes("%") ? nextCursor : encodeURIComponent(nextCursor);
        let nextRes = await fetch(
          `https://library-service.live.use1a.on.epicgames.com/library/api/public/items?includeMetadata=true&cursor=${cursorParam}`,
          { headers: { Authorization: `Bearer ${accessToken}`, "User-Agent": USER_AGENT } }
        );

        if (!nextRes.ok && cursorParam !== nextCursor) {
          nextRes = await fetch(
            `https://library-service.live.use1a.on.epicgames.com/library/api/public/items?includeMetadata=true&cursor=${nextCursor}`,
            { headers: { Authorization: `Bearer ${accessToken}`, "User-Agent": USER_AGENT } }
          );
        }

        if (!nextRes.ok) break;
        const nextData = await nextRes.json();
        const nextRecords = Array.isArray(nextData)
          ? nextData
          : Array.isArray(nextData?.records)
          ? nextData.records
          : [];
        if (nextRecords.length === 0) break;
        records.push(...nextRecords);
        nextCursor = nextData?.responseMetadata?.nextCursor || nextData?.nextCursor || nextData?.cursor;
      } catch {
        break;
      }
    }
  } catch {}
  return records;
}

export async function fetchLauncherAssets(accessToken: string): Promise<any[]> {
  try {
    const res = await fetch(
      "https://launcher-public-service-prod06.ol.epicgames.com/launcher/api/public/assets/Windows?label=Live",
      { headers: { Authorization: `Bearer ${accessToken}`, "User-Agent": USER_AGENT } }
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch {}
  return [];
}

export async function fetchEntitlements(accessToken: string, accountId: string): Promise<any[]> {
  try {
    const res = await fetch(
      `https://entitlement-public-service-prod08.ol.epicgames.com/entitlement/api/account/${accountId}/entitlements?start=0&count=5000`,
      { headers: { Authorization: `Bearer ${accessToken}`, "User-Agent": USER_AGENT } }
    );
    if (res.ok) {
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      return list
        .filter((ent: any) => ent.entitlementName && ent.namespace)
        .map((ent: any) => ({
          appName: ent.entitlementName,
          catalogItemId: ent.catalogItemId,
          catalogNamespace: ent.namespace,
          namespace: ent.namespace,
          title: ent.entitlementName,
        }));
    }
  } catch {}
  return [];
}

export async function fetchEpicLibraryItems(
  accessToken: string,
  accountId?: string
): Promise<any[]> {
  const items = await fetchLibraryServiceItems(accessToken);
  if (items.length > 0) return items;

  const assets = await fetchLauncherAssets(accessToken);
  if (assets.length > 0) return assets;

  if (accountId) {
    return await fetchEntitlements(accessToken, accountId);
  }
  return [];
}

export async function batchResolveCatalogTitlesAndImages(
  namespaceMap: Map<string, string[]>,
  accessToken: string
): Promise<Map<string, { title: string; image: string }>> {
  const catalogTitles = new Map<string, { title: string; image: string }>();
  const nsEntries = Array.from(namespaceMap.entries());
  const BATCH_SIZE = 10;

  for (let i = 0; i < nsEntries.length; i += BATCH_SIZE) {
    const chunk = nsEntries.slice(i, i + BATCH_SIZE);
    await Promise.all(
      chunk.map(async ([ns, ids]) => {
        try {
          const queryIds = ids
            .map((id) => `id=${encodeURIComponent(id)}`)
            .join("&");
          const cRes = await fetch(
            `https://catalog-public-service-prod06.ol.epicgames.com/catalog/api/shared/namespace/${ns}/bulk/items?${queryIds}&includeDLCDetails=true&includeMainGameDetails=true&country=FR&locale=fr-FR`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "User-Agent":
                  "EpicGamesLauncher/14.0.8-22004686+++Portal+Release-Live",
              },
            }
          );
          if (cRes.ok) {
            const cData = await cRes.json();
            const items = Array.isArray(cData) ? cData : Object.values(cData);
            for (const it of items as any[]) {
              const itId = it?.id;
              const itTitle = it?.title || it?.name;
              if (itId && itTitle) {
                const imgUrl = extractBestCover(
                  it.keyImages,
                  it.customAttributes
                );
                catalogTitles.set(itId, { title: itTitle, image: imgUrl });
              }
            }
          }
        } catch {}
      })
    );
  }

  return catalogTitles;
}

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
