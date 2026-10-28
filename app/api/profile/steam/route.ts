import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getUserPlatformApiKey } from "@/lib/db";
import { syncSteamProfile } from "@/lib/steam/profile-sync";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawUser = searchParams.get("user")?.trim();
  let apiKey =
    searchParams.get("key")?.trim() || process.env.STEAM_API_KEY?.trim() || "";

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

  try {
    const result = await syncSteamProfile(rawUser, apiKey, authUser?.id);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Steam Profile API error:", error);
    const status = error.status || 500;
    return NextResponse.json(
      {
        error:
          error.message ||
          "Impossible de récupérer les informations du profil Steam.",
        details: error.message,
      },
      { status }
    );
  }
}
