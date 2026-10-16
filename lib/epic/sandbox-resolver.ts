// lib/epic/sandbox-resolver.ts
import { fetchEpicLibraryItems } from "./library";
import { hashCode, normalizeTitle } from "./helpers";

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
