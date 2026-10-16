import { NextResponse } from "next/server";
import type {
  OwnedGame,
  PlatformAccount,
  RareAchievementShowcaseItem,
} from "@/lib/types";

const SEASONAL_BADGE_PATTERNS = [
  /soldes d/i,
  /collection d/i,
  /steam awards/i,
  /grand prix/i,
  /winter sale/i,
  /summer sale/i,
  /spring cleaning/i,
  /replay/i,
];

const HTML_ENTITIES: Record<string, string> = {
  "&nbsp;": " ",
  "&quot;": '"',
  "&#39;": "'",
  "&lt;": "<",
  "&gt;": ">",
  "&amp;": "&",
};

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&(?:nbsp|quot|#39|lt|gt|amp);/g, (match) => HTML_ENTITIES[match] || match)
    .trim();
}

import { getAuthenticatedUser } from "@/lib/auth";
import {
  getUserPlatformApiKey,
  saveUserPlatformAccount,
  saveUserOwnedGames,
} from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawUser = searchParams.get("user")?.trim();
  let apiKey = searchParams.get("key")?.trim() || process.env.STEAM_API_KEY?.trim() || "";

  let authUser = null;
  try {
    authUser = await getAuthenticatedUser();
    if (!apiKey && authUser) {
      const storedKey = getUserPlatformApiKey(authUser.id, "steam");
      if (storedKey) apiKey = storedKey;
    }
  } catch {
    // Non-blocking auth lookup
  }

  if (!rawUser) {
    return NextResponse.json(
      { error: "Paramètre 'user' requis (SteamID64, pseudo ou URL)." },
      { status: 400 }
    );
  }


  let userIdentifier = rawUser;
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
  const baseUrl = `https://steamcommunity.com/${pathType}/${encodeURIComponent(
    userIdentifier
  )}`;

  const headers = {
    Cookie:
      "Steam_Language=french; mature_content=1; birthtime=568022401; lastagecheckage=1-January-1990",
    "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  };

  try {
    const [xmlRes, htmlRes, badgesRes, recRes] = await Promise.all([
      fetch(`${baseUrl}/?xml=1`, { headers, next: { revalidate: 60 } }),
      fetch(`${baseUrl}/?l=french`, { headers, next: { revalidate: 60 } }),
      fetch(`${baseUrl}/badges/?l=french`, { headers, next: { revalidate: 120 } }).catch(
        () => null
      ),
      fetch(`${baseUrl}/recommended/?l=french`, {
        headers,
        next: { revalidate: 120 },
      }).catch(() => null),
    ]);

    if (!htmlRes.ok) {
      return NextResponse.json(
        { error: `Impossible de joindre le profil Steam (${htmlRes.status}).` },
        { status: htmlRes.status }
      );
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
      return NextResponse.json(
        {
          error: `Profil Steam introuvable pour "${rawUser}". Vérifiez votre SteamID64 ou votre URL personnalisée.`,
        },
        { status: 404 }
      );
    }

    const getXmlTag = (tag: string): string => {
      const m = xml.match(
        new RegExp(
          `<${tag}><!\\[CDATA\\[(.*?)\\]\\]><\\/${tag}>|<${tag}>(.*?)<\\/${tag}>`,
          "s"
        )
      );
      return m ? (m[1] ?? m[2] ?? "").trim() : "";
    };

    const steamId64 = getXmlTag("steamID64") || (!isVanity ? userIdentifier : "");
    const personaName =
      getXmlTag("steamID") ||
      decodeHtmlEntities(
        html.match(/class="actual_persona_name">([^<]+)</)?.[1] || userIdentifier
      );
    const avatarFull =
      getXmlTag("avatarFull") ||
      html.match(
        /playerAvatarAutoSizeInner[^>]*>[\s\S]*?<img[^>]*src="([^"]+)"/
      )?.[1] ||
      "";
    const onlineState = getXmlTag("onlineState") || "offline";
    const memberSince = getXmlTag("memberSince") || "";
    const location = getXmlTag("location") || "";
    const hoursPlayed2Wk = parseFloat(getXmlTag("hoursPlayed2Wk") || "0") || 0;

    const levelMatch = html.match(/friendPlayerLevelNum[^>]*>(\d+)</);
    const level = levelMatch ? parseInt(levelMatch[1], 10) : 0;

    // 1. Parse profile_count_link stats
    const countMap: Record<string, number> = {};
    for (const m of html.matchAll(
      /<span class="count_link_label">([^<]+)<\/span>[\s\S]*?<span class="profile_count_link_total">\s*([^<]+)\s*<\/span>/g
    )) {
      const key = m[1].trim().toLowerCase();
      const val = parseInt(m[2].replace(/[^\d]/g, ""), 10) || 0;
      countMap[key] = val;
    }

    let gamesOwned = countMap["jeux"] || countMap["games"] || 0;
    let totalAchievements = 0;
    let completedGames = 0;
    let dlcCount = 0;
    let wishlistCount = 0;
    let badgesCount = countMap["badges"] || 0;

    // 2. Parse showcase counters
    for (const m of html.matchAll(
      /<div class="value">([^<]+)<\/div>\s*<div class="label">([^<]+)<\/div>/g
    )) {
      const val = parseInt(m[1].replace(/[^\d]/g, ""), 10) || 0;
      const label = m[2].trim().toLowerCase();
      if (label.includes("succès") || label.includes("achievement")) {
        totalAchievements = Math.max(totalAchievements, val);
      }
      if (label.includes("terminés") || label.includes("perfect")) {
        completedGames = Math.max(completedGames, val);
      }
      if (label === "jeux" || label === "games") {
        gamesOwned = Math.max(gamesOwned, val);
      }
      if (label === "dlc") {
        dlcCount = Math.max(dlcCount, val);
      }
      if (label.includes("souhaits") || label.includes("wishlist")) {
        wishlistCount = Math.max(wishlistCount, val);
      }
    }

    // 3. Parse Rare Achievements Showcase
    const rareShowcase: RareAchievementShowcaseItem[] = [];
    for (const m of html.matchAll(
      /<div class="showcase_achievement[^"]*"\s+data-tooltip-html="([^"]+)"[^>]*>[\s\S]*?href="[^"]*\/achievements\/(\d+)"[\s\S]*?<img src="([^"]+)"/g
    )) {
      const tooltip = decodeHtmlEntities(m[1]);
      const appId = parseInt(m[2], 10);
      const icon = m[3];
      const parts = tooltip.split(/<br\s*\/?>/i).map((s) => s.trim());
      if (parts.length >= 2 && appId) {
        const gameName = parts[0];
        const achievementName = parts[1];
        const pctMatch = (parts[2] || "").match(/([\d,.]+)\s*%/);
        const percent = pctMatch
          ? parseFloat(pctMatch[1].replace(",", "."))
          : 1.0;
        rareShowcase.push({
          appId,
          gameName,
          achievementName,
          percent,
          icon,
        });
      }
    }

    // 4. Discover owned games across all accessible public sections
    const gamesMap = new Map<
      number,
      {
        appId: number;
        name?: string;
        totalAchievements: number;
        unlockedCount: number;
        playtimeHours?: number;
      }
    >();

    const upsertDiscovered = (
      appId: number,
      data: {
        name?: string;
        totalAchievements?: number;
        unlockedCount?: number;
        playtimeHours?: number;
      }
    ) => {
      if (!appId || Number.isNaN(appId)) return;
      const existing = gamesMap.get(appId);
      gamesMap.set(appId, {
        appId,
        name: data.name || existing?.name,
        totalAchievements: Math.max(
          data.totalAchievements ?? 0,
          existing?.totalAchievements ?? 0
        ),
        unlockedCount: Math.max(
          data.unlockedCount ?? 0,
          existing?.unlockedCount ?? 0
        ),
        playtimeHours: data.playtimeHours ?? existing?.playtimeHours,
      });
    };

    // 4a. From Recent Games on Profile HTML
    const recentBlocks = html.split('<div class="recent_game">').slice(1);
    for (const block of recentBlocks) {
      const appMatch = block.match(/\/app\/(\d+)/);
      if (!appMatch) continue;
      const appId = parseInt(appMatch[1], 10);
      const nameMatch = block.match(
        /class="game_name"[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>/
      );
      const detailsMatch = block.match(
        /class="game_info_details"[^>]*>([\s\S]*?)<\/div>/
      );
      let playtimeHours: number | undefined;
      if (detailsMatch) {
        const hrsMatch = detailsMatch[1].match(/([\d,.]+)\s*h\s*en tout/i);
        if (hrsMatch) {
          playtimeHours = parseFloat(hrsMatch[1].replace(",", "."));
        }
      }

      let unlockedCount = 0;
      let totalAch = 0;
      const achSummaryMatch = block.match(
        /class="game_info_achievement_summary"[^>]*>[\s\S]*?(\d+)\s*succès\s*sur\s*(\d+)/
      );
      if (achSummaryMatch) {
        unlockedCount = parseInt(achSummaryMatch[1], 10) || 0;
        totalAch = parseInt(achSummaryMatch[2], 10) || 0;
      }

      upsertDiscovered(appId, {
        name: nameMatch ? decodeHtmlEntities(nameMatch[1]) : undefined,
        playtimeHours,
        unlockedCount,
        totalAchievements: totalAch,
      });
    }

    // 4b. From 100% Completionist Showcase
    const compSlots = html
      .split("showcase_achievementscompletionist_game ")
      .slice(1);
    for (const slot of compSlots) {
      const appMatch = slot.match(/achievements\/(\d+)/);
      const numMatch = slot.match(/class="num_achievements">(\d+)/);
      if (appMatch) {
        const appId = parseInt(appMatch[1], 10);
        const count = numMatch ? parseInt(numMatch[1], 10) : 0;
        upsertDiscovered(appId, {
          totalAchievements: count,
          unlockedCount: count,
        });
      }
    }

    // 4c. From Rare Achievements Showcase
    for (const item of rareShowcase) {
      upsertDiscovered(item.appId, {
        name: item.gameName,
        unlockedCount: 1,
      });
    }

    // 4d. From Game Collector Showcase (Favorite games)
    for (const m of html.matchAll(
      /showcase_gamecollector_game[\s\S]*?href="https:\/\/steamcommunity\.com\/app\/(\d+)"/g
    )) {
      upsertDiscovered(parseInt(m[1], 10), {});
    }

    // 4e. From Badges Page (/badges/)
    if (badgesHtml) {
      const badgeRows = badgesHtml.split('class="badge_row ');
      if (!badgesCount && badgeRows.length > 1) {
        badgesCount = badgeRows.length - 1;
      }
      for (let i = 1; i < badgeRows.length; i++) {
        const row = badgeRows[i];
        const appMatch = row.match(/gamecards\/(\d+)/);
        const titleMatch = row.match(/<div class="badge_title">\s*([^<\t\r\n]+)/);
        if (appMatch && titleMatch) {
          const appId = parseInt(appMatch[1], 10);
          const rawTitle = decodeHtmlEntities(titleMatch[1]);
          const isSeasonal = SEASONAL_BADGE_PATTERNS.some((rx) =>
            rx.test(rawTitle)
          );
          if (!isSeasonal) {
            upsertDiscovered(appId, { name: rawTitle });
          }
        }
      }
    }

    // 4f. From Reviews Page (/recommended/)
    if (recHtml) {
      for (const m of recHtml.matchAll(
        /href="https:\/\/steamcommunity\.com\/app\/(\d+)"/g
      )) {
        upsertDiscovered(parseInt(m[1], 10), {});
      }
    }

    // 4g. From Most Played Games in Profile XML
    if (xml) {
      const mostPlayedBlocks = xml.split(/<mostPlayedGame>/).slice(1);
      for (const block of mostPlayedBlocks) {
        const appMatch =
          block.match(/<gameLink>.*?\/app\/(\d+)<\/gameLink>/) ||
          block.match(/<statsName><!\[CDATA\[(\d+)\]\]><\/statsName>/);
        const nameMatch = block.match(
          /<gameName><!\[CDATA\[(.*?)\]\]><\/gameName>/
        );
        const hrsMatch = block.match(
          /<hoursOnRecord>([\d,.]+)<\/hoursOnRecord>/
        );
        if (appMatch) {
          const appId = parseInt(appMatch[1], 10);
          const name = nameMatch ? decodeHtmlEntities(nameMatch[1]) : undefined;
          const hrs = hrsMatch
            ? parseFloat(hrsMatch[1].replace(",", "."))
            : undefined;
          upsertDiscovered(appId, { name, playtimeHours: hrs });
        }
      }
    }

    // 4h. From Steam Web API GetOwnedGames (if optional API key provided)
    if (apiKey && steamId64) {
      try {
        const ownedRes = await fetch(
          `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${encodeURIComponent(
            apiKey
          )}&steamid=${encodeURIComponent(
            steamId64
          )}&include_appinfo=1&include_played_free_games=1`,
          { next: { revalidate: 300 } }
        );
        if (ownedRes.ok) {
          const ownedData = await ownedRes.json();
          const gameList = ownedData?.response?.games;
          if (Array.isArray(gameList)) {
            gamesOwned = Math.max(
              gamesOwned,
              ownedData.response.game_count || gameList.length
            );
            for (const g of gameList) {
              if (g.appid) {
                upsertDiscovered(g.appid, {
                  name: g.name,
                  playtimeHours: g.playtime_forever
                    ? Math.round((g.playtime_forever / 60) * 10) / 10
                    : 0,
                });
              }
            }
          }
        }
      } catch {
        // Continue gracefully if Steam API key request fails
      }
    }

    // 5. Resolve missing game names via Steam Store API in parallel (fast)
    const missingNameEntries = Array.from(gamesMap.values()).filter(
      (g) => !g.name
    );
    await Promise.all(
      missingNameEntries.map(async (entry) => {
        try {
          const r = await fetch(
            `https://store.steampowered.com/api/appdetails?appids=${entry.appId}&l=french&cc=fr`,
            { next: { revalidate: 86400 } }
          );
          if (r.ok) {
            const d = await r.json();
            const info = d?.[entry.appId]?.data;
            if (info?.name) {
              entry.name = info.name;
            }
            if (info?.achievements?.total && !entry.totalAchievements) {
              entry.totalAchievements = info.achievements.total;
            }
          }
        } catch {
          // Ignore individual store lookup error
        }
      })
    );

    const nowIso = new Date().toISOString();
    const discoveredGames: OwnedGame[] = Array.from(gamesMap.values()).map(
      (g) => ({
        appId: g.appId,
        name: g.name || `Jeu Steam #${g.appId}`,
        headerImg: `https://cdn.akamai.steamstatic.com/steam/apps/${g.appId}/header.jpg`,
        platform: "steam",
        totalAchievements: g.totalAchievements,
        unlockedCount: g.unlockedCount,
        playtimeHours: g.playtimeHours,
        addedAt: nowIso,
        source: "steam-auto",
      })
    );

    const account: PlatformAccount = {
      platform: "steam",
      username: steamId64 || userIdentifier,
      displayName: personaName,
      avatarUrl: avatarFull,
      profileUrl: baseUrl,
      level,
      onlineState,
      memberSince,
      location,
      connectedAt: nowIso,
      lastSyncedAt: nowIso,
      stats: {
        gamesOwned: Math.max(gamesOwned, discoveredGames.length),
        totalAchievements,
        completedGames,
        hoursPlayed: hoursPlayed2Wk,
        badges: badgesCount,
        dlcCount,
        wishlistCount,
      },
      rareShowcase: rareShowcase.slice(0, 6),
    };

    if (authUser) {
      try {
        saveUserPlatformAccount(authUser.id, account, apiKey || undefined);
        if (discoveredGames.length > 0) {
          saveUserOwnedGames(authUser.id, discoveredGames);
        }
      } catch (saveErr) {
        console.warn("Could not auto-persist Steam data to database:", saveErr);
      }
    }

    return NextResponse.json({
      success: true,
      account,
      discoveredGames,
    });

  } catch (error: any) {
    console.error("Steam Profile API error:", error);
    return NextResponse.json(
      {
        error: "Impossible de récupérer les informations du profil Steam.",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
