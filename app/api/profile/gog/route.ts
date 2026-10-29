// app/api/profile/gog/route.ts
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import {
  saveUserGameProgress,
  saveUserOwnedGames,
  saveUserPlatformAccount,
} from "@/lib/db";
import { errorMessage } from "@/lib/error-message";
import { fetchGogProfile, GogSyncError } from "@/lib/gog/service";
import { readProfileSyncRequest } from "@/lib/accounts/profile-sync-request";

export async function POST(request: Request) {
  const { user: rawUser, secret: token } = await readProfileSyncRequest(request);

  let authUser = null;
  try {
    authUser = await getAuthenticatedUser();
  } catch (authErr: unknown) {
    if (authErr instanceof Error) authUser = null;
  }

  if (!rawUser) {
    return NextResponse.json(
      { error: "Paramètre 'user' (pseudo GOG) requis." },
      { status: 400 }
    );
  }

  try {
    const { account, discoveredGames, gameProgress } = await fetchGogProfile(
      rawUser,
      token
    );

    if (authUser) {
      try {
        saveUserPlatformAccount(authUser.id, account, token || undefined);
        if (discoveredGames.length > 0) {
          saveUserOwnedGames(authUser.id, discoveredGames);
        }
        if (gameProgress) {
          for (const [appIdStr, unlockedIds] of Object.entries(gameProgress)) {
            const appId = parseInt(appIdStr, 10);
            if (appId && unlockedIds.length > 0) {
              saveUserGameProgress(authUser.id, appId, "gog", {
                unlockedIds: [...unlockedIds],
                notes: {},
              });
            }
          }
        }
      } catch (saveErr: unknown) {
        console.warn("Could not auto-persist GOG data to database:", saveErr);
      }
    }

    return NextResponse.json({
      success: true,
      account,
      discoveredGames,
    });
  } catch (err: unknown) {
    console.error("GOG profile API error:", err);
    const status = err instanceof GogSyncError ? err.status : 500;
    const message =
      errorMessage(err, "Impossible de joindre le profil GOG.");
    return NextResponse.json(
      { error: message, details: message },
      { status }
    );
  }
}
