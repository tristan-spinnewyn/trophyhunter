// lib/steam/profile-scraper.ts
import type { RareAchievementShowcaseItem } from "@/lib/types";
import { decodeHtmlEntities, parseXmlTag } from "./html";
import type { DiscoveredGameData, SteamParsedProfile } from "./types";

export const SEASONAL_BADGE_PATTERNS = [
  /soldes d/i,
  /collection d/i,
  /steam awards/i,
  /grand prix/i,
  /winter sale/i,
  /summer sale/i,
  /spring cleaning/i,
  /replay/i,
];

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

export function extractGamesFromProfileHtml(
  html: string,
  upsert: (appId: number, data: Partial<DiscoveredGameData>) => void
): void {
  const recentBlocks = html.split('<div class="recent_game">').slice(1);
  for (const block of recentBlocks) {
    const appMatch = block.match(/\/app\/(\d+)/);
    if (!appMatch) continue;
    const appId = parseInt(appMatch[1], 10);
    const nameMatch = block.match(/class="game_name"[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>/);
    const detailsMatch = block.match(/class="game_info_details"[^>]*>([\s\S]*?)<\/div>/);
    let playtimeHours: number | undefined;
    if (detailsMatch) {
      const hrsMatch = detailsMatch[1].match(/([\d,.]+)\s*h\s*en tout/i);
      if (hrsMatch) playtimeHours = parseFloat(hrsMatch[1].replace(",", "."));
    }
    let unlockedCount = 0;
    let totalAch = 0;
    const achSummaryMatch = block.match(/class="game_info_achievement_summary"[^>]*>[\s\S]*?(\d+)\s*succès\s*sur\s*(\d+)/);
    if (achSummaryMatch) {
      unlockedCount = parseInt(achSummaryMatch[1], 10) || 0;
      totalAch = parseInt(achSummaryMatch[2], 10) || 0;
    }
    upsert(appId, {
      name: nameMatch ? decodeHtmlEntities(nameMatch[1]) : undefined,
      playtimeHours, unlockedCount, totalAchievements: totalAch,
    });
  }

  const compSlots = html.split("showcase_achievementscompletionist_game ").slice(1);
  for (const slot of compSlots) {
    const appMatch = slot.match(/achievements\/(\d+)/);
    const numMatch = slot.match(/class="num_achievements">(\d+)/);
    if (appMatch) {
      const appId = parseInt(appMatch[1], 10);
      const count = numMatch ? parseInt(numMatch[1], 10) : 0;
      upsert(appId, { totalAchievements: count, unlockedCount: count });
    }
  }

  for (const m of html.matchAll(/showcase_gamecollector_game[\s\S]*?href="https:\/\/steamcommunity\.com\/app\/(\d+)"/g)) {
    upsert(parseInt(m[1], 10), {});
  }
}

export function extractGamesFromBadges(
  badgesHtml: string,
  upsert: (appId: number, data: Partial<DiscoveredGameData>) => void
): number {
  if (!badgesHtml) return 0;
  const badgeRows = badgesHtml.split('class="badge_row ');
  const count = badgeRows.length > 1 ? badgeRows.length - 1 : 0;
  for (let i = 1; i < badgeRows.length; i++) {
    const row = badgeRows[i];
    const appMatch = row.match(/gamecards\/(\d+)/);
    const titleMatch = row.match(/<div class="badge_title">\s*([^<\t\r\n]+)/);
    if (appMatch && titleMatch) {
      const appId = parseInt(appMatch[1], 10);
      const rawTitle = decodeHtmlEntities(titleMatch[1]);
      if (!SEASONAL_BADGE_PATTERNS.some((rx) => rx.test(rawTitle))) {
        upsert(appId, { name: rawTitle });
      }
    }
  }
  return count;
}

export function extractGamesFromReviews(recHtml: string, upsert: (appId: number, data: Partial<DiscoveredGameData>) => void): void {
  if (!recHtml) return;
  for (const m of recHtml.matchAll(/href="https:\/\/steamcommunity\.com\/app\/(\d+)"/g)) {
    upsert(parseInt(m[1], 10), {});
  }
}

export function extractGamesFromXml(xml: string, upsert: (appId: number, data: Partial<DiscoveredGameData>) => void): void {
  if (!xml) return;
  for (const block of xml.split(/<mostPlayedGame>/).slice(1)) {
    const appMatch = block.match(/<gameLink>.*?\/app\/(\d+)<\/gameLink>/) || block.match(/<statsName><!\[CDATA\[(\d+)\]\]><\/statsName>/);
    const nameMatch = block.match(/<gameName><!\[CDATA\[(.*?)\]\]><\/gameName>/);
    const hrsMatch = block.match(/<hoursOnRecord>([\d,.]+)<\/hoursOnRecord>/);
    if (appMatch) {
      upsert(parseInt(appMatch[1], 10), {
        name: nameMatch ? decodeHtmlEntities(nameMatch[1]) : undefined,
        // The XML profile uses en-US numbers: "," separates thousands ("1,234.5").
        playtimeHours: hrsMatch ? parseFloat(hrsMatch[1].replace(/,/g, "")) : undefined,
      });
    }
  }
}
