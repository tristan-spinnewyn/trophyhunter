// lib/steam/fetcher.ts
export interface RawSteamProfileResponses {
  xml: string;
  html: string;
  badgesHtml: string;
  recHtml: string;
}

export async function fetchRawSteamProfilePages(baseUrl: string, rawUser: string): Promise<RawSteamProfileResponses> {
  const headers = {
    Cookie: "Steam_Language=french; mature_content=1; birthtime=568022401; lastagecheckage=1-January-1990",
    "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  };

  const [xmlRes, htmlRes, badgesRes, recRes] = await Promise.all([
    fetch(`${baseUrl}/?xml=1`, { headers, next: { revalidate: 60 } }),
    fetch(`${baseUrl}/?l=french`, { headers, next: { revalidate: 60 } }),
    fetch(`${baseUrl}/badges/?l=french`, { headers, next: { revalidate: 120 } }).catch(() => null),
    fetch(`${baseUrl}/recommended/?l=french`, { headers, next: { revalidate: 120 } }).catch(() => null),
  ]);

  if (!htmlRes.ok) {
    const error: any = new Error(`Impossible de joindre le profil Steam (${htmlRes.status}).`);
    error.status = htmlRes.status;
    throw error;
  }

  const [xml, html, badgesHtml, recHtml] = await Promise.all([
    xmlRes.ok ? xmlRes.text() : Promise.resolve(""),
    htmlRes.text(),
    badgesRes && badgesRes.ok ? badgesRes.text() : Promise.resolve(""),
    recRes && recRes.ok ? recRes.text() : Promise.resolve(""),
  ]);

  if (
    html.includes("The specified profile could not be found") ||
    html.includes("Profil introuvable") ||
    xml.includes("The specified profile could not be found")
  ) {
    const error: any = new Error(`Profil Steam introuvable pour "${rawUser}". Vérifiez votre SteamID64 ou votre URL personnalisée.`);
    error.status = 404;
    throw error;
  }

  return { xml, html, badgesHtml, recHtml };
}
