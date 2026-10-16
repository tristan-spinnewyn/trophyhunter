// lib/steam/identifier.ts
export function parseSteamIdentifier(rawUser: string): {
  userIdentifier: string;
  isVanity: boolean;
  baseUrl: string;
} {
  let userIdentifier = rawUser.trim();
  let isVanity = true;

  const urlMatch = rawUser.match(
    /steamcommunity\.com\/(id|profiles)\/([^\s/?#]+)/i
  );
  if (urlMatch) {
    isVanity = urlMatch[1].toLowerCase() === "id";
    userIdentifier = urlMatch[2];
  } else if (/^\d{16,20}$/.test(rawUser)) {
    isVanity = false;
  }

  const pathType = isVanity ? "id" : "profiles";
  const baseUrl = `https://steamcommunity.com/${pathType}/${encodeURIComponent(userIdentifier)}`;

  return { userIdentifier, isVanity, baseUrl };
}

export function parseXmlTag(xml: string, tag: string): string {
  const m = xml.match(
    new RegExp(`<${tag}><!\\[CDATA\\[(.*?)\\]\\]><\\/${tag}>|<${tag}>(.*?)<\\/${tag}>`, "s")
  );
  return m ? (m[1] ?? m[2] ?? "").trim() : "";
}
