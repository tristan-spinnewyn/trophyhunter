// lib/steam/sync.ts
import { getAuthenticatedUser } from "@/lib/auth";
import { getUserGameProgress, saveUserGameProgress } from "@/lib/db";
import { validateAndBuildSteamSyncUrls } from "./sync-validator";
import { parseSteamSyncXml } from "./sync-xml-parser";
import { parseSteamSyncHtml, stripHtmlTags } from "./sync-html-parser";

export { stripHtmlTags };

export interface SteamSyncGameResult {
  success: boolean;
  user: string;
  isVanity: boolean;
  gameName?: string;
  headerImg: string;
  totalAchievements: number;
  unlockedTitles: string[];
  unlockedIds: string[];
  count: number;
}

export async function syncSteamGame(rawUser: string, appId: string): Promise<SteamSyncGameResult> {
  const { userIdentifier, isVanity, xmlUrl, schemaUrl, headers } = validateAndBuildSteamSyncUrls(rawUser, appId);

  const [response, globalRes] = await Promise.all([
    fetch(xmlUrl.toString(), { headers, next: { revalidate: 30 } }),
    fetch(schemaUrl.toString(), { headers, next: { revalidate: 600 } }).catch(() => null),
  ]);

  if (!response.ok) {
    if (response.status === 404) {
      const err: any = new Error(`Profil Steam introuvable pour "${rawUser}". Vérifiez l'ID ou le pseudo.`);
      err.status = 404;
      throw err;
    }
    throw new Error(`Erreur Steam (${response.status})`);
  }

  const html = await response.text();
  const globalHtml = globalRes && globalRes.ok ? await globalRes.text() : "";

  if (
    html.includes("Ce profil est privé") || html.includes("This profile is private") ||
    html.includes("profile_private_info") || html.includes("Vous n'avez pas la permission de voir") ||
    html.includes("<privacyState>private</privacyState>") || html.includes("<privacyState>friendsonly</privacyState>")
  ) {
    const err: any = new Error("Ce profil Steam (ou ses Détails des jeux) est en privé. Pour synchroniser sans clé, passez les 'Détails des jeux' en Public dans vos paramètres de confidentialité Steam.");
    err.status = 403;
    err.isPrivate = true;
    throw err;
  }

  if (html.includes("The specified profile could not be found") || html.includes("Profil introuvable") || html.includes("<error>The specified profile could not be found")) {
    const err: any = new Error("Profil introuvable. Avez-vous renseigné le bon SteamID ou pseudo personnalisé ?");
    err.status = 404;
    throw err;
  }

  let schemaAchievements: any[] | null = null;
  try {
    const parsed = JSON.parse(globalHtml);
    if (Array.isArray(parsed?.response?.achievements)) schemaAchievements = parsed.response.achievements;
  } catch {}

  const isXml = html.includes("<playerstats>") || html.includes("<achievements>");
  const parsed = isXml
    ? parseSteamSyncXml(html, schemaAchievements)
    : parseSteamSyncHtml(html, globalHtml);

  try {
    const authUser = await getAuthenticatedUser();
    if (authUser && parsed.unlockedIds.length > 0) {
      const appIdNum = parseInt(appId, 10);
      const existingProg = getUserGameProgress(authUser.id, appIdNum, "steam") || { unlockedIds: [], notes: {} };
      const mergedIds = Array.from(new Set([...existingProg.unlockedIds, ...parsed.unlockedIds]));
      saveUserGameProgress(authUser.id, appIdNum, "steam", {
        ...existingProg,
        unlockedIds: mergedIds,
        lastPlayed: new Date().toISOString(),
      });
    }
  } catch (saveErr) {
    console.warn("Could not auto-persist sync progress to SQLite:", saveErr);
  }

  return {
    success: true,
    user: userIdentifier,
    isVanity,
    gameName: parsed.gameName || undefined,
    headerImg: `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`,
    totalAchievements: parsed.totalAchievements,
    unlockedTitles: parsed.unlockedTitles,
    unlockedIds: parsed.unlockedIds,
    count: parsed.unlockedTitles.length,
  };
}
