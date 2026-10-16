import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getSteamGameDetails } from "@/lib/steam/game-details";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const appId = id?.trim();

  if (!appId || !/^\d+$/.test(appId)) {
    return NextResponse.json({ error: "AppID Steam invalide." }, { status: 400 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const nameParam = searchParams.get("name")?.trim();
    const fastMode = searchParams.get("fast") === "1";

    let authUser = null;
    try {
      authUser = await getAuthenticatedUser();
    } catch {
      // Non-blocking
    }

    const gameDetails = await getSteamGameDetails({
      appId,
      nameParam,
      fastMode,
      authUserId: authUser?.id,
    });

    return NextResponse.json(gameDetails);
  } catch (error: any) {
    console.error("Game API error:", error);
    return NextResponse.json(
      { error: "Impossible de charger les données du jeu.", details: error.message },
      { status: 500 }
    );
  }
}
