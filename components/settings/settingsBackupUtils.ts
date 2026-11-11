// components/settings/settingsBackupUtils.ts
import { isBackupFile } from "@/lib/backup/backup-format";

/** The full backup of the signed-in user, as pretty-printed JSON. */
export async function fetchExportJson(): Promise<string> {
  const res = await fetch("/api/user/backup");
  if (!res.ok) throw new Error("Export failed");
  return JSON.stringify(await res.json(), null, 2);
}

/** Thrown with the server's own explanation when it refuses an import. */
export class BackupImportError extends Error {}

/** Sends pasted JSON to the right place: a full backup is restored, an older export goes through the sync. */
export async function importBackupText(importText: string): Promise<void> {
  const parsed: unknown = JSON.parse(importText);
  const [url, body] = isBackupFile(parsed) ? ["/api/user/backup", parsed] : ["/api/user/sync", parseSyncPayload(importText)];
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new BackupImportError(data.error ?? "L'import a échoué.");
  }
}

export function parseSyncPayload(importText: string) {
  const parsed = JSON.parse(importText);
  if (parsed.games || parsed.profile || parsed.progress) return parsed;
  return {
    profile: parsed["trophyhunter_account_v1"], games: parsed["trophyhunter_owned_games_v1"],
    favorites: parsed["trophyhunter_favorites"], wishlist: parsed["trophyhunter_wishlist_v1"],
    collections: parsed["trophyhunter_collections_v1"], steamApiKey: parsed["trophyhunter_steam_api_key"],
    progress: Object.fromEntries(Object.entries(parsed).filter(([k]) => k.startsWith("trophyhunter_game_"))),
  };
}

export async function saveSteamAccountApi(username: string, plainApiKey?: string) {
  await fetch("/api/user/account", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      account: {
        platform: "steam", username, displayName: username,
        connectedAt: new Date().toISOString(), lastSyncedAt: new Date().toISOString(),
        stats: { gamesOwned: 0, totalAchievements: 0, completedGames: 0 },
      },
      plainApiKey: plainApiKey || undefined,
    }),
  });
}
