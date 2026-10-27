// lib/epic/sandbox.ts
import { normalizeGameTitle } from "../db/collections";
import { hashCode, normalizeTitle } from "./game-metadata";
import { fetchEpicLibraryItems } from "./library";

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

export function matchSandboxRecord(
  records: any[],
  normTitle: string,
  knownSandbox?: string | null
): any | null {
  for (const rec of records) {
    const sId = (rec.sandboxId || "").toLowerCase();
    const cleanSid = sId
      .replace(/^ns_?/, "")
      .replace(/_?sandbox$/, "")
      .replace(/[^a-z0-9]/g, "");

    const recProductName = (rec.productName || "").trim();
    const normRecProduct = normalizeGameTitle(recProductName);

    if (
      (knownSandbox && sId === knownSandbox.toLowerCase()) ||
      cleanSid === normTitle ||
      (normTitle.length >= 4 && cleanSid.startsWith(normTitle)) ||
      (cleanSid.length >= 4 && normTitle.startsWith(cleanSid)) ||
      (normRecProduct && normRecProduct === normTitle) ||
      (normRecProduct.length >= 4 && normTitle.includes(normRecProduct)) ||
      (normTitle.length >= 4 && normRecProduct.includes(normTitle))
    ) {
      return rec;
    }
  }
  return null;
}
