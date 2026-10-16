// lib/steam/sync-validator.ts
export interface ValidatedSteamSyncInput {
  userIdentifier: string;
  isVanity: boolean;
  xmlUrl: URL;
  schemaUrl: URL;
  headers: Record<string, string>;
}

export function validateAndBuildSteamSyncUrls(rawUser: string, appId: string): ValidatedSteamSyncInput {
  if (!/^\d{1,10}$/.test(appId)) {
    const err: any = new Error("Paramètre 'appId' invalide (chiffres uniquement).");
    err.status = 400;
    throw err;
  }

  let userIdentifier = rawUser;
  let isVanity = true;

  const urlMatch = rawUser.match(/steamcommunity\.com\/(id|profiles)\/([a-zA-Z0-9_-]+)/i);
  if (urlMatch) {
    isVanity = urlMatch[1].toLowerCase() === "id";
    userIdentifier = urlMatch[2];
  } else if (/^\d{16,20}$/.test(rawUser)) {
    isVanity = false;
  }

  if (isVanity) {
    if (!/^[a-zA-Z0-9_-]{2,64}$/.test(userIdentifier)) {
      const err: any = new Error("Pseudo ou identifiant Steam personnalisé invalide.");
      err.status = 400;
      throw err;
    }
  } else {
    if (!/^\d{16,20}$/.test(userIdentifier)) {
      const err: any = new Error("SteamID64 invalide (16 à 20 chiffres attendus).");
      err.status = 400;
      throw err;
    }
  }

  const pathType = isVanity ? "id" : "profiles";
  const safeUser = encodeURIComponent(userIdentifier);
  const safeAppId = encodeURIComponent(appId);

  const xmlUrl = new URL(`https://steamcommunity.com/${pathType}/${safeUser}/stats/${safeAppId}/`);
  xmlUrl.searchParams.set("xml", "1");

  const schemaUrl = new URL("https://api.steampowered.com/IPlayerService/GetGameAchievements/v1/");
  schemaUrl.searchParams.set("appid", safeAppId);
  schemaUrl.searchParams.set("language", "french");

  const headers = {
    Cookie: "Steam_Language=french; mature_content=1; birthtime=568022401; lastagecheckage=1-January-1990",
    "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  };

  return { userIdentifier, isVanity, xmlUrl, schemaUrl, headers };
}
