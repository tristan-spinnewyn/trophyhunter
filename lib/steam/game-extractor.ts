// lib/steam/game-extractor.ts
import { decodeHtmlEntities, SEASONAL_BADGE_PATTERNS, type DiscoveredGameData } from "./types";

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
        playtimeHours: hrsMatch ? parseFloat(hrsMatch[1].replace(",", ".")) : undefined,
      });
    }
  }
}
