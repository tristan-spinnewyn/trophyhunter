// lib/wishlist/store-price.ts

import type { PlatformType } from "@/lib/types";

/** A store's current price for a game, in the currency's smallest unit. */
export interface StorePrice {
  readonly cents: number;
  readonly currency: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

/** Reads Steam's `appdetails?filters=price_overview` answer; null for a free, unknown or odd entry. */
export function parseSteamPrice(json: unknown, appId: number): StorePrice | null {
  if (!isRecord(json)) return null;
  const entry = json[String(appId)];
  if (!isRecord(entry) || entry.success !== true || !isRecord(entry.data)) return null;
  const overview = entry.data.price_overview;
  if (!isRecord(overview) || !Number.isInteger(overview.final) || typeof overview.currency !== "string") return null;
  return { cents: overview.final as number, currency: overview.currency };
}

/** Reads GOG's product prices answer ("1499 EUR"); null when no readable price is listed. */
export function parseGogPrice(json: unknown): StorePrice | null {
  if (!isRecord(json) || !isRecord(json._embedded) || !Array.isArray(json._embedded.prices)) return null;
  const first: unknown = json._embedded.prices[0];
  if (!isRecord(first) || typeof first.finalPrice !== "string") return null;
  const match = /^(\d+)\s+([A-Z]{3})$/.exec(first.finalPrice.trim());
  return match ? { cents: Number(match[1]), currency: match[2] } : null;
}

const PRICE_SOURCES: Partial<Record<PlatformType, { url: (appId: number) => string; parse: (json: unknown, appId: number) => StorePrice | null }>> = {
  steam: {
    url: (appId) => `https://store.steampowered.com/api/appdetails?appids=${appId}&cc=fr&filters=price_overview`,
    parse: parseSteamPrice,
  },
  gog: {
    url: (appId) => `https://api.gog.com/products/${appId}/prices?countryCode=FR`,
    parse: (json) => parseGogPrice(json),
  },
};

/** Platforms whose store publishes prices the app can read. */
export const PRICED_PLATFORMS = Object.keys(PRICE_SOURCES) as PlatformType[];

/** The current price of a game on its store, in France; null for other stores or when the store does not answer. */
export async function fetchStorePrice(platform: PlatformType, appId: number): Promise<StorePrice | null> {
  const source = PRICE_SOURCES[platform];
  if (!source) return null;
  try {
    const res = await fetch(source.url(appId), { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    return source.parse(await res.json(), appId);
  } catch {
    return null;
  }
}

/** True once the last known price is at or under the price the owner is waiting for. */
export function hasReachedTarget({ lastPriceCents, targetPriceCents }: { readonly lastPriceCents?: number; readonly targetPriceCents?: number }): boolean {
  return lastPriceCents !== undefined && targetPriceCents !== undefined && lastPriceCents <= targetPriceCents;
}

/** "14,99 €" */
export function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(cents / 100);
}
