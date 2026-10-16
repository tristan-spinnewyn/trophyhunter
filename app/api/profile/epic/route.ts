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
