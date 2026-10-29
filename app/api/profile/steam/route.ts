import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { syncSteamProfile } from "@/lib/steam/profile-sync";
import { errorStatus, publicErrorMessage } from "@/lib/error-message";
import { readProfileSyncRequest } from "@/lib/accounts/profile-sync-request";
import { resolvePlatformApiKey } from "@/lib/accounts/platform-api-key";

export async function POST(request: Request) {
  const { user: rawUser, secret } = await readProfileSyncRequest(request);

  let authUser = null;
  try {
    authUser = await getAuthenticatedUser();
  } catch {
    // Non-blocking auth lookup
  }
  const apiKey = resolvePlatformApiKey("steam", { userId: authUser?.id, providedKey: secret });

  if (!rawUser) {
    return NextResponse.json(
      { error: "Paramètre 'user' requis (SteamID64, pseudo ou URL)." },
      { status: 400 }
    );
  }

  try {
    const result = await syncSteamProfile(rawUser, apiKey, authUser?.id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Steam Profile API error:", error);
    const status = errorStatus(error, 500);
    return NextResponse.json(
      {
        error: publicErrorMessage(error, "Impossible de récupérer les informations du profil Steam."),
      },
      { status }
    );
  }
}
