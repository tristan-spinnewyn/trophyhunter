// app/api/profile/xbox/route.ts

import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import {
  getUserPlatformApiKey,
  saveUserPlatformAccount,
  saveUserOwnedGames,
} from "@/lib/db";
import { fetchXboxProfileLive, buildFallbackXboxAccount } from "@/lib/xbox/service";
import { XboxApiError } from "@/lib/xbox/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawUser = searchParams.get("user")?.trim();
  let apiKey =
    searchParams.get("key")?.trim() ||
    process.env.OPENXBL_API_KEY?.trim() ||
    process.env.XBL_API_KEY?.trim() ||
    process.env.XBOX_API_KEY?.trim() ||
    "";

  let authUser = null;
  try {
    authUser = await getAuthenticatedUser();
    if (!apiKey && authUser) {
      const stored = getUserPlatformApiKey(authUser.id, "xbox");
      if (stored) apiKey = stored;
    }
  } catch (err: unknown) {
    console.warn("Unable to resolve authenticated user for Xbox sync:", err);
  }

  if (!rawUser) {
    return NextResponse.json(
      { error: "Paramètre 'user' requis (Gamertag ou XUID Xbox)." },
      { status: 400 }
    );
  }

  const nowIso = new Date().toISOString();

  if (apiKey) {
    try {
      const { account, discoveredGames } = await fetchXboxProfileLive(
        rawUser,
        apiKey,
        nowIso
      );

      if (authUser) {
        try {
          saveUserPlatformAccount(authUser.id, account, apiKey || undefined);
          if (discoveredGames.length > 0) {
            saveUserOwnedGames(authUser.id, discoveredGames);
          }
        } catch (saveErr: unknown) {
          console.warn("Could not auto-persist Xbox data to database:", saveErr);
        }
      }

      return NextResponse.json({ success: true, account, discoveredGames });
    } catch (err: unknown) {
      if (err instanceof XboxApiError) {
        return NextResponse.json(
          { error: err.message },
          { status: err.status }
        );
      }
      console.error("OpenXBL API error:", err);
    }
  }

  const fallbackAccount = buildFallbackXboxAccount(rawUser, nowIso);
  if (authUser) {
    try {
      saveUserPlatformAccount(authUser.id, fallbackAccount);
    } catch (saveErr: unknown) {
      console.warn("Could not auto-persist Xbox account to database:", saveErr);
    }
  }

  return NextResponse.json({
    success: true,
    account: fallbackAccount,
    discoveredGames: [],
    notice:
      "Compte Xbox Live enregistré sans clé API (0 jeu importé). Pour importer automatiquement vos jeux et succès Xbox / Game Pass, renseignez votre clé API OpenXBL (xbl.io).",
  });
}
