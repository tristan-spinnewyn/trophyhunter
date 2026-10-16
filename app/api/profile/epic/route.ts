import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import {
  syncEpicProfileWithOAuth,
  createEpicProfileUsernameOnly,
} from "@/lib/epic/service";

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

  let code = rawCode;
  if (code.startsWith("{")) {
    try {
      const parsed = JSON.parse(code);
      code = (
        parsed.authorizationCode ||
        parsed.authorizationToken ||
        parsed.code ||
        parsed.token ||
        parsed.access_token ||
        code
      ).trim();
    } catch {}
  } else if (code.includes("code=")) {
    const m = code.match(/[?&]code=([a-f0-9]+)/i);
    if (m) code = m[1];
  }

  if (!rawUser && !code) {
    return NextResponse.json(
      {
        error:
          "Paramètre 'user' (pseudo Epic Games) ou 'authorizationToken' / 'code' (code d'autorisation Epic) requis.",
      },
      { status: 400 }
    );
  }

  // Mode 1: Authentication via official Epic Games Authorization Code
  if (code) {
    try {
      const result = await syncEpicProfileWithOAuth(code, rawUser, authUser);
      if (!result.success) {
        return NextResponse.json(
          { error: result.error, details: result.details },
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
        },
        { status: 500 }
      );
    }
  }

  // Mode 2: Username registration without credentials
  const result = createEpicProfileUsernameOnly(rawUser!, authUser);
  return NextResponse.json(result);
}
