// components/settings/settingsBackupUtils.ts

export async function fetchExportJson(): Promise<string> {
  const res = await fetch("/api/user/sync");
  if (!res.ok) throw new Error("Export failed");
  const syncData = await res.json();
  return JSON.stringify({
    profile: syncData.profile, games: syncData.games || [],
    progress: syncData.progress || {}, favorites: syncData.favorites || [],
    wishlist: syncData.wishlist || [], collections: syncData.collections || [],
  }, null, 2);
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
