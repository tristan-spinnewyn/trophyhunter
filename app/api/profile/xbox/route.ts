// app/api/profile/xbox/route.ts

import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { saveUserPlatformAccount, saveUserOwnedGames } from "@/lib/db";
import { fetchXboxProfileLive, buildFallbackXboxAccount } from "@/lib/xbox/service";
import { XboxApiError } from "@/lib/xbox/types";
import { readProfileSyncRequest } from "@/lib/accounts/profile-sync-request";
import { resolvePlatformApiKey } from "@/lib/accounts/platform-api-key";
import { anonymousRateLimitResponse } from "@/lib/security/anonymous-rate-limit";

export async function POST(request: Request) {
  const { user: rawUser, secret } = await readProfileSyncRequest(request);

  let authUser = null;
  try {
    authUser = await getAuthenticatedUser();
  } catch (err: unknown) {
    console.warn("Unable to resolve authenticated user for Xbox sync:", err);
  }
  const rateLimited = anonymousRateLimitResponse(request, Boolean(authUser));
  if (rateLimited) return rateLimited;
  const apiKey = resolvePlatformApiKey("xbox", { userId: authUser?.id, providedKey: secret });

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
          // Only the caller's own key is stored: the server key must not be copied into a user record.
          saveUserPlatformAccount(authUser.id, account, secret || undefined);
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
