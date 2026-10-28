import { NextResponse } from "next/server";
import { syncEpicGame } from "@/lib/epic/game-sync";
import { syncSteamGame } from "@/lib/steam/sync";
import { errorMessage, errorStatus } from "@/lib/error-message";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawUser = searchParams.get("user")?.trim();
  const appId = searchParams.get("appId")?.trim();
  const platform = (searchParams.get("platform") || "steam").toLowerCase();
  const gameName = (
    searchParams.get("name") || searchParams.get("gameName")
  )?.trim();

  if (platform === "epic") {
    if (!appId) {
      return NextResponse.json(
        { error: "Paramètre 'appId' requis." },
        { status: 400 }
      );
    }
    const result = await syncEpicGame(request, appId, gameName);
    return NextResponse.json(result);
  }

  if (!rawUser || !appId) {
    return NextResponse.json(
      { error: "Paramètres 'user' et 'appId' requis." },
      { status: 400 }
    );
  }

  try {
    const result = await syncSteamGame(rawUser, appId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Sync API error:", error);
    const status = errorStatus(error, 500);
    const body: { error: string; isPrivate?: boolean; details?: string } = {
      error: errorMessage(error, "Impossible de synchroniser avec le profil Steam."),
    };
    if ((error as { isPrivate?: boolean } | null)?.isPrivate) body.isPrivate = true;
    if (status === 500) body.details = errorMessage(error, "");

    return NextResponse.json(body, { status });
  }
}
