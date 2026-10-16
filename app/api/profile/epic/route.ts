import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import {
  syncEpicProfileWithOAuth,
  createEpicProfileUsernameOnly,
} from "@/lib/epic/service";
import { parseEpicAuthInput, loadStoredEpicCredentials } from "@/lib/epic/credentials";

export async function GET(request: Request) {
  let authUser = null;
  try {
    authUser = await getAuthenticatedUser();
  } catch {}

  const { searchParams } = new URL(request.url);
  const rawUser = searchParams.get("user")?.trim();
  const rawCode = (
    searchParams.get("authorizationToken") ||
    searchParams.get("authorization_token") ||
    searchParams.get("authorizationCode") ||
    searchParams.get("authorization_code") ||
    searchParams.get("code") ||
    searchParams.get("token") ||
    request.headers.get("x-authorization-token") ||
    ""
  ).trim();

  const code = parseEpicAuthInput(rawCode);

  if (!rawUser && !code) {
    return NextResponse.json(
      {
        error:
          "Paramètre 'user' (pseudo Epic Games) ou 'authorizationToken' / 'code' (code d'autorisation Epic) requis.",
        requiresToken: true,
      },
      { status: 400 }
    );
  }

  const storedCreds = authUser ? loadStoredEpicCredentials(authUser.id) : null;
  const hasStoredToken = Boolean(storedCreds?.accessToken || storedCreds?.refreshToken);

  // Mode 1: Authentication via official Epic Games Authorization Code or stored credentials
  if (code || hasStoredToken) {
    try {
      const result = await syncEpicProfileWithOAuth(code, rawUser, authUser);
      if (!result.success) {
        return NextResponse.json(
          {
            error: result.error,
            details: result.details,
            requiresToken: result.status === 401,
          },
          { status: result.status }
        );
      }
      return NextResponse.json(result);
    } catch (err: any) {
      console.error("Epic Auth error:", err);
      return NextResponse.json(
        {
          error: "Impossible de joindre l'API Epic Games.",
          details: err.message,
          requiresToken: true,
        },
        { status: 500 }
      );
    }
  }

  // Mode 2: Username registration without credentials
  const result = createEpicProfileUsernameOnly(rawUser!, authUser);
  return NextResponse.json({
    ...result,
    requiresToken: true,
  });
}
