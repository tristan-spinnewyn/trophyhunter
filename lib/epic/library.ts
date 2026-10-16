// lib/epic/library.ts
import { fetchLibraryServiceItems } from "./library-service";
import { fetchLauncherAssets, fetchEntitlements } from "./library-assets";

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
