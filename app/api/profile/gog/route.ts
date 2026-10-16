// app/api/profile/gog/route.ts

import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { saveUserPlatformAccount, saveUserOwnedGames } from "@/lib/db";
import { fetchGogProfile } from "@/lib/gog/service";

export async function GET(request: Request) {
  let authUser = null;
  try {
    authUser = await getAuthenticatedUser();
  } catch {}

  const { searchParams } = new URL(request.url);
  const rawUser = searchParams.get("user")?.trim();
  const token = searchParams.get("token")?.trim();

  if (!rawUser) {
    return NextResponse.json(
      { error: "Paramètre 'user' (pseudo GOG) requis." },
      { status: 400 }
    );
  }

  try {
    const { account, discoveredGames } = await fetchGogProfile(rawUser, token);

    if (authUser) {
      try {
        saveUserPlatformAccount(authUser.id, account, token || undefined);
        if (discoveredGames.length > 0) {
          saveUserOwnedGames(authUser.id, discoveredGames);
        }
      } catch (saveErr) {
        console.warn("Could not auto-persist GOG data to database:", saveErr);
      }
    }

    return NextResponse.json({
      success: true,
      account,
      discoveredGames,
    });
  } catch (err: any) {
    console.error("GOG profile API error:", err);
    return NextResponse.json(
      { error: "Impossible de joindre le profil GOG.", details: err.message },
      { status: 500 }
    );
  }
}
