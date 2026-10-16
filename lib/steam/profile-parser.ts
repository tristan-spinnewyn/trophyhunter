// lib/steam/profile-parser.ts
import { decodeHtmlEntities, type SteamParsedProfile } from "./types";
import type { RareAchievementShowcaseItem } from "@/lib/types";
import { parseXmlTag } from "./identifier";

export function parseSteamProfile(
  xml: string,
  html: string,
  userIdentifier: string,
  isVanity: boolean,
  baseUrl: string
): SteamParsedProfile {
  const steamId64 = parseXmlTag(xml, "steamID64") || (!isVanity ? userIdentifier : "");
  const personaName =
    parseXmlTag(xml, "steamID") ||
    decodeHtmlEntities(html.match(/class="actual_persona_name">([^<]+)</)?.[1] || userIdentifier);
  const avatarFull =
    parseXmlTag(xml, "avatarFull") ||
    html.match(/playerAvatarAutoSizeInner[^>]*>[\s\S]*?<img[^>]*src="([^"]+)"/)?.[1] || "";
  const onlineState = parseXmlTag(xml, "onlineState") || "offline";
  const memberSince = parseXmlTag(xml, "memberSince") || "";
  const location = parseXmlTag(xml, "location") || "";
  const hoursPlayed2Wk = parseFloat(parseXmlTag(xml, "hoursPlayed2Wk") || "0") || 0;

  const levelMatch = html.match(/friendPlayerLevelNum[^>]*>(\d+)</);
  const level = levelMatch ? parseInt(levelMatch[1], 10) : 0;

  const countMap: Record<string, number> = {};
  for (const m of html.matchAll(
    /<span class="count_link_label">([^<]+)<\/span>[\s\S]*?<span class="profile_count_link_total">\s*([^<]+)\s*<\/span>/g
  )) {
    countMap[m[1].trim().toLowerCase()] = parseInt(m[2].replace(/[^\d]/g, ""), 10) || 0;
  }

  let gamesOwned = countMap["jeux"] || countMap["games"] || 0;
  let totalAchievements = 0;
  let completedGames = 0;
  let dlcCount = 0;
  let wishlistCount = 0;
  const badgesCount = countMap["badges"] || 0;

  for (const m of html.matchAll(/<div class="value">([^<]+)<\/div>\s*<div class="label">([^<]+)<\/div>/g)) {
    const val = parseInt(m[1].replace(/[^\d]/g, ""), 10) || 0;
    const label = m[2].trim().toLowerCase();
    if (label.includes("succès") || label.includes("achievement")) totalAchievements = Math.max(totalAchievements, val);
    if (label.includes("terminés") || label.includes("perfect")) completedGames = Math.max(completedGames, val);
    if (label === "jeux" || label === "games") gamesOwned = Math.max(gamesOwned, val);
    if (label === "dlc") dlcCount = Math.max(dlcCount, val);
    if (label.includes("souhaits") || label.includes("wishlist")) wishlistCount = Math.max(wishlistCount, val);
  }

  const rareShowcase: RareAchievementShowcaseItem[] = [];
  for (const m of html.matchAll(
    /<div class="showcase_achievement[^"]*"\s+data-tooltip-html="([^"]+)"[^>]*>[\s\S]*?href="[^"]*\/achievements\/(\d+)"[\s\S]*?<img src="([^"]+)"/g
  )) {
    const tooltip = decodeHtmlEntities(m[1]);
    const appId = parseInt(m[2], 10);
    const icon = m[3];
    const parts = tooltip.split(/<br\s*\/?>/i).map((s) => s.trim());
    if (parts.length >= 2 && appId) {
      const pctMatch = (parts[2] || "").match(/([\d,.]+)\s*%/);
      rareShowcase.push({
        appId,
        gameName: parts[0],
        achievementName: parts[1],
        percent: pctMatch ? parseFloat(pctMatch[1].replace(",", ".")) : 1.0,
        icon,
      });
    }
  }

  return {
    steamId64, userIdentifier, personaName, avatarFull, onlineState,
    memberSince, location, hoursPlayed2Wk, level, gamesOwned,
    totalAchievements, completedGames, dlcCount, wishlistCount,
    badgesCount, rareShowcase, baseUrl,
  };
}
