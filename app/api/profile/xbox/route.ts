import { NextResponse } from "next/server";
import type { OwnedGame, PlatformAccount } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawUser = searchParams.get("user")?.trim();
  const apiKey =
    searchParams.get("key")?.trim() || process.env.OPENXBL_API_KEY?.trim() || "";

  if (!rawUser) {
    return NextResponse.json(
      { error: "Paramètre 'user' requis (Gamertag ou XUID Xbox)." },
      { status: 400 }
    );
  }

  const nowIso = new Date().toISOString();

  // If OpenXBL API key is provided, perform live synchronization with Xbox Live
  if (apiKey) {
    try {
      const headers = {
        "X-Authorization": apiKey,
        Accept: "application/json",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
      };

      // 1. Resolve user profile and XUID via OpenXBL
      // Check if user is already an XUID or search by Gamertag
      let xuid = rawUser;
      let gamerTag = rawUser;
      let avatarUrl = "";
      let gamerScore = 0;

      if (!/^\d{15,20}$/.test(rawUser)) {
        // Search by Gamertag
        const searchRes = await fetch(
          `https://api.xbl.io/v2/friends/search?gt=${encodeURIComponent(rawUser)}`,
          { headers, next: { revalidate: 120 } }
        );

        if (searchRes.ok) {
          const searchData = await searchRes.json();
          const profile = searchData?.profileUsers?.[0];
          if (profile) {
            xuid = profile.id || xuid;
            for (const setting of profile.settings || []) {
              if (setting.id === "Gamertag") gamerTag = setting.value;
              if (setting.id === "GameDisplayPicRaw") avatarUrl = setting.value;
              if (setting.id === "Gamerscore") {
                gamerScore = parseInt(setting.value, 10) || 0;
              }
            }
          }
        }
      }

      // 2. Fetch Title History (recently played / owned games on Xbox & PC Game Pass)
      const titleRes = await fetch(
        `https://api.xbl.io/v2/player/title-history/${encodeURIComponent(xuid)}`,
        { headers, next: { revalidate: 120 } }
      );

      const discoveredGames: OwnedGame[] = [];
      let totalAchievements = 0;
      let completedGames = 0;

      if (titleRes.ok) {
        const titleData = await titleRes.json();
        const titles = Array.isArray(titleData?.titles) ? titleData.titles : [];

        for (const title of titles) {
          if (!title.titleId || !title.name) continue;
          const totalAch = title.achievement?.totalAchievements || 0;
          const currentAch = title.achievement?.currentAchievements || 0;

          totalAchievements += currentAch;
          if (totalAch > 0 && currentAch >= totalAch) {
            completedGames++;
          }

          const rawId = parseInt(title.titleId, 10) || Math.abs(hashCode(String(title.titleId)));

          discoveredGames.push({
            appId: rawId,
            name: title.name,
            headerImg:
              title.displayImage ||
              `https://images-eds-ssl.xboxlive.com/image?url=${encodeURIComponent(
                title.image || ""
              )}`,
            platform: "xbox",
            totalAchievements: totalAch,
            unlockedCount: currentAch,
            addedAt: nowIso,
            source: "manual",
          });
        }
      }

      const account: PlatformAccount = {
        platform: "xbox",
        username: rawUser,
        displayName: gamerTag || rawUser,
        avatarUrl: avatarUrl || undefined,
        profileUrl: `https://www.xbox.com/fr-FR/play`,
        connectedAt: nowIso,
        lastSyncedAt: nowIso,
        stats: {
          gamesOwned: Math.max(discoveredGames.length, 0),
          totalAchievements,
          completedGames,
          gamerScore,
        },
      };

      return NextResponse.json({
        success: true,
        account,
        discoveredGames,
      });
    } catch (err: any) {
      console.error("OpenXBL API error:", err);
      // Fallback gracefully to basic account registration
    }
  }

  // Fallback: If no API key or OpenXBL is temporarily unreachable, register account with Gamertag
  const account: PlatformAccount = {
    platform: "xbox",
    username: rawUser,
    displayName: rawUser,
    profileUrl: `https://www.xbox.com/fr-FR/play`,
    connectedAt: nowIso,
    lastSyncedAt: nowIso,
    stats: {
      gamesOwned: 0,
      totalAchievements: 0,
      completedGames: 0,
      gamerScore: 0,
    },
  };

  return NextResponse.json({
    success: true,
    account,
    discoveredGames: [],
    notice:
      "Compte Xbox Live enregistré. Pour importer automatiquement l'intégralité de vos jeux et succès Xbox / Game Pass, renseignez une clé gratuite OpenXBL (api.xbl.io).",
  });
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
