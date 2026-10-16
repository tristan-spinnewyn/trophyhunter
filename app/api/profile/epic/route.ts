import { NextResponse } from "next/server";
import type { OwnedGame, PlatformAccount } from "@/lib/types";

const EPIC_CLIENT_ID = "34a02cf8f4414e29b15921876da36f9a";
const EPIC_CLIENT_SECRET = "daafbccc737745039dffe53d94fc76cf";
const EPIC_BASIC_AUTH = Buffer.from(
  `${EPIC_CLIENT_ID}:${EPIC_CLIENT_SECRET}`
).toString("base64");

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawUser = searchParams.get("user")?.trim();
  const code = searchParams.get("code")?.trim();

  if (!rawUser && !code) {
    return NextResponse.json(
      {
        error:
          "Paramètre 'user' (pseudo Epic Games) ou 'code' (code d'autorisation Epic) requis.",
      },
      { status: 400 }
    );
  }

  const nowIso = new Date().toISOString();

  // Mode 1: Authentication via official Epic Games Authorization Code
  if (code) {
    try {
      const tokenRes = await fetch(
        "https://account-public-service-prod03.ol.epicgames.com/account/api/oauth/token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${EPIC_BASIC_AUTH}`,
          },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            code: code,
            token_type: "eg1",
          }).toString(),
        }
      );

      if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        return NextResponse.json(
          {
            error:
              "Code d'autorisation Epic Games expiré ou invalide. Rendez-vous sur https://www.epicgames.com/id/api/redirect?clientId=34a02cf8f4414e29b15921876da36f9a&responseType=code pour obtenir un nouveau code.",
            details: errText,
          },
          { status: 401 }
        );
      }

      const tokenData = await tokenRes.json();
      const accessToken = tokenData.access_token;
      const accountId = tokenData.account_id;
      const displayName = tokenData.displayName || rawUser || "Joueur Epic";

      const discoveredGames: OwnedGame[] = [];
      const totalAchievements = 0;
      const completedGames = 0;

      // Fetch user's owned games from Epic Launcher assets endpoint
      if (accessToken && accountId) {
        try {
          const assetsRes = await fetch(
            `https://launcher-public-service-prod06.ol.epicgames.com/launcher/api/public/assets/Windows?label=Live`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          if (assetsRes.ok) {
            const assets = await assetsRes.json();
            if (Array.isArray(assets)) {
              for (const asset of assets) {
                if (!asset.appName || asset.appName.startsWith("UE_")) continue;
                const idNum = Math.abs(hashCode(asset.appName));
                discoveredGames.push({
                  appId: idNum,
                  name: asset.appName.replace(/([A-Z])/g, " $1").trim(),
                  headerImg: `https://cdn1.epicgames.com/item/${asset.catalogItemId}/header.jpg`,
                  platform: "epic",
                  totalAchievements: 0,
                  unlockedCount: 0,
                  addedAt: nowIso,
                  source: "manual",
                });
              }
            }
          }
        } catch {
          // Graceful fallback if asset inventory endpoint fails
        }
      }

      const account: PlatformAccount = {
        platform: "epic",
        username: accountId || rawUser || displayName,
        displayName: displayName,
        connectedAt: nowIso,
        lastSyncedAt: nowIso,
        stats: {
          gamesOwned: discoveredGames.length,
          totalAchievements,
          completedGames,
        },
      };

      return NextResponse.json({
        success: true,
        account,
        discoveredGames,
      });
    } catch (err: any) {
      console.error("Epic Auth error:", err);
      return NextResponse.json(
        { error: "Impossible de joindre l'API Epic Games.", details: err.message },
        { status: 500 }
      );
    }
  }

  // Mode 2: Username registration without credentials
  const account: PlatformAccount = {
    platform: "epic",
    username: rawUser!,
    displayName: rawUser!,
    connectedAt: nowIso,
    lastSyncedAt: nowIso,
    stats: {
      gamesOwned: 0,
      totalAchievements: 0,
      completedGames: 0,
    },
  };

  return NextResponse.json({
    success: true,
    account,
    discoveredGames: [],
    notice:
      "Compte Epic Games configuré. Vous pouvez synchroniser vos jeux avec un code temporaire ou ajouter manuellement vos jeux Epic.",
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
