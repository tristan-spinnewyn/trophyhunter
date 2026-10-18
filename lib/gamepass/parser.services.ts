// lib/gamepass/parser.services.ts

import { hashCode } from "@/lib/xbox/openxbl";
import type {
  GamePassCatalogItem,
  GamePassSiglEntry,
  MsDisplayCatalogAlternateId,
  MsDisplayCatalogImage,
  MsDisplayCatalogProduct,
  MsDisplayCatalogResponse,
} from "./gamepass.types";

const PREFERRED_IMAGE_PURPOSES: readonly string[] = [
  "TitledHeroArt", "SuperHeroArt", "Poster", "BoxArt", "BrandedKeyArt", "FeaturePromotionalSquareArt",
];

export function extractSiglProductIds(payload: unknown): string[] {
  if (!Array.isArray(payload)) return [];
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const item of payload as readonly GamePassSiglEntry[]) {
    const rawId = typeof item?.id === "string" ? item.id.trim() : "";
    if (rawId && !seen.has(rawId)) {
      seen.add(rawId);
      ids.push(rawId);
    }
  }
  return ids;
}

export function normalizeMsImageUri(rawUri?: string): string {
  const trimmed = rawUri?.trim() ?? "";
  if (!trimmed) return "";
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  if (/^http:\/\//i.test(trimmed)) return trimmed.replace(/^http:\/\//i, "https://");
  return trimmed;
}

export function resolveMsStoreImage(images?: readonly MsDisplayCatalogImage[]): string {
  if (!Array.isArray(images) || images.length === 0) return "";
  for (const purpose of PREFERRED_IMAGE_PURPOSES) {
    const match = images.find((img) => img.ImagePurpose === purpose && Boolean(img.Uri?.trim()));
    if (match?.Uri) return normalizeMsImageUri(match.Uri);
  }
  const fallback = images.find((img) => Boolean(img.Uri?.trim()));
  return normalizeMsImageUri(fallback?.Uri);
}

export function resolveNumericAppId(
  storeId: string,
  alternateIds?: readonly MsDisplayCatalogAlternateId[]
): number {
  if (Array.isArray(alternateIds)) {
    const xboxTitle = alternateIds.find((a) => a.IdType === "XboxTitleId" && Boolean(a.Value?.trim()));
    const parsed = xboxTitle?.Value ? parseInt(xboxTitle.Value.trim(), 10) : NaN;
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  const fallbackHash = Math.abs(hashCode(storeId));
  return fallbackHash > 0 ? fallbackHash : 1;
}

export function parseDisplayCatalogProduct(product: MsDisplayCatalogProduct): GamePassCatalogItem | null {
  const storeId = product.ProductId?.trim() ?? "";
  const localized = product.LocalizedProperties?.[0];
  const name = (localized?.ProductTitle || localized?.ShortTitle || "").trim();
  if (!storeId || !name) return null;

  const attrNames = new Set((product.Properties?.Attributes ?? []).map((a) => a.Name ?? ""));
  const category = product.Properties?.Category?.trim() || product.Properties?.Categories?.[0]?.trim() || "Jeu PC";
  const rawDescription = localized?.ShortDescription?.trim() || localized?.ProductDescription?.trim() || "";

  return {
    storeId,
    appId: resolveNumericAppId(storeId, product.AlternateIds),
    name,
    headerImg: resolveMsStoreImage(localized?.Images),
    developer: localized?.DeveloperName?.trim() || "Studio Xbox / PC",
    publisher: localized?.PublisherName?.trim() || "Xbox Game Studios",
    category,
    shortDescription: rawDescription.slice(0, 240),
    hasXboxAchievements: attrNames.has("XblAchievements") || attrNames.has("XboxLive"),
    isPlayAnywhere: attrNames.has("XPA"),
    releaseDate: product.MarketProperties?.[0]?.OriginalReleaseDate,
  };
}

export function parseDisplayCatalogProducts(payload: unknown): GamePassCatalogItem[] {
  if (!payload || typeof payload !== "object" || !("Products" in payload)) return [];
  const products = (payload as MsDisplayCatalogResponse).Products;
  if (!Array.isArray(products)) return [];
  return products.map(parseDisplayCatalogProduct).filter((item): item is GamePassCatalogItem => item !== null);
}
