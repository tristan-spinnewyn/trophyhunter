// lib/gamepass/catalog.services.ts

import { GamePassCatalogError, type GamePassCatalogItem } from "./gamepass.types";
import { extractSiglProductIds, parseDisplayCatalogProducts } from "./parser.services";

const PC_GAMEPASS_SIGL_ID = "fdd9e2a7-0fee-49f6-ad69-4354098401ff";
const SIGL_ENDPOINT = `https://catalog.gamepass.com/sigls/v2?id=${PC_GAMEPASS_SIGL_ID}&language=fr-fr&market=FR`;
const DISPLAY_CATALOG_BASE = "https://displaycatalog.mp.microsoft.com/v7.0/products";
const BATCH_SIZE = 50;
const CACHE_TTL_MS = 30 * 60 * 1000;

interface CachedCatalog {
  readonly games: readonly GamePassCatalogItem[];
  readonly fetchedAt: string;
  readonly expiresAt: number;
}

let cachedCatalog: CachedCatalog | null = null;

export function clearGamePassCatalogCache(): void {
  cachedCatalog = null;
}

export function chunkArray<T>(items: readonly T[], chunkSize: number): T[][] {
  if (chunkSize <= 0) return [];
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}

async function fetchProductBatch(ids: readonly string[]): Promise<GamePassCatalogItem[]> {
  const url = `${DISPLAY_CATALOG_BASE}?bigIds=${encodeURIComponent(ids.join(","))}&market=FR&languages=fr-fr&MS-CV=DGU1mcuYo0WMMp`;
  const res = await fetch(url, { next: { revalidate: 1800 } });
  if (!res.ok) {
    throw new GamePassCatalogError(
      `Microsoft DisplayCatalog HTTP ${res.status}`,
      res.status
    );
  }
  const payload: unknown = await res.json();
  return parseDisplayCatalogProducts(payload);
}

export async function fetchPcGamePassCatalog(options?: {
  readonly forceRefresh?: boolean;
}): Promise<{ readonly games: readonly GamePassCatalogItem[]; readonly fetchedAt: string }> {
  const now = Date.now();
  if (!options?.forceRefresh && cachedCatalog && cachedCatalog.expiresAt > now) {
    return { games: cachedCatalog.games, fetchedAt: cachedCatalog.fetchedAt };
  }

  const siglRes = await fetch(SIGL_ENDPOINT, { next: { revalidate: 1800 } });
  if (!siglRes.ok) {
    throw new GamePassCatalogError(
      `Impossible de récupérer la liste PC Game Pass (${siglRes.status}).`,
      siglRes.status
    );
  }

  const siglPayload: unknown = await siglRes.json();
  const productIds = extractSiglProductIds(siglPayload);
  if (productIds.length === 0) {
    return { games: [], fetchedAt: new Date(now).toISOString() };
  }

  const batches = chunkArray(productIds, BATCH_SIZE);
  const batchResults = await Promise.all(batches.map(fetchProductBatch));
  const merged = new Map<string, GamePassCatalogItem>();
  for (const batch of batchResults) {
    for (const item of batch) {
      if (!merged.has(item.storeId)) {
        merged.set(item.storeId, item);
      }
    }
  }

  const games = Array.from(merged.values()).sort((a, b) =>
    a.name.localeCompare(b.name, "fr", { sensitivity: "base" })
  );
  const fetchedAt = new Date(now).toISOString();

  cachedCatalog = {
    games,
    fetchedAt,
    expiresAt: now + CACHE_TTL_MS,
  };

  return { games, fetchedAt };
}
