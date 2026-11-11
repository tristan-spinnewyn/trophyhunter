// app/api/profile/gog/route.ts
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { publicErrorMessage } from "@/lib/error-message";
import { fetchGogProfile, GogSyncError } from "@/lib/gog/service";
import { persistGogSync } from "@/lib/gog/persist-sync";
import { readProfileSyncRequest } from "@/lib/accounts/profile-sync-request";
import { anonymousRateLimitResponse } from "@/lib/security/anonymous-rate-limit";

export async function POST(request: Request) {
  const { user: rawUser, secret: token } = await readProfileSyncRequest(request);

  let authUser = null;
  try {
    authUser = await getAuthenticatedUser();
  } catch (authErr: unknown) {
    if (authErr instanceof Error) authUser = null;
  }
  const rateLimited = anonymousRateLimitResponse(request, Boolean(authUser));
  if (rateLimited) return rateLimited;

  if (!rawUser) {
    return NextResponse.json(
      { error: "Paramètre 'user' (pseudo GOG) requis." },
      { status: 400 }
    );
  }

  try {
    const result = await fetchGogProfile(rawUser, token);
    const { account, discoveredGames } = result;

    if (authUser) {
      try {
        persistGogSync(authUser.id, result, token);
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
    return NextResponse.json(
      { error: publicErrorMessage(err, "Impossible de joindre le profil GOG.") },
      { status }
    );
  }
}
