import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getSteamGameDetails } from "@/lib/steam/game-details";
import { getEpicAchievementsForUser } from "@/lib/epic/game-details";

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
    const platform = searchParams.get("platform")?.trim().toLowerCase();

    let authUser = null;
    try {
      authUser = await getAuthenticatedUser();
    } catch {
      // Non-blocking
    }

    const isEpic = platform === "epic" && !!authUser && !fastMode;

    const [gameDetails, epicAchievements] = await Promise.all([
      getSteamGameDetails({
        appId,
        nameParam,
        fastMode,
        authUserId: isEpic ? undefined : authUser?.id,
      }),
      isEpic
        ? getEpicAchievementsForUser(authUser!.id, parseInt(appId, 10), nameParam || "")
        : Promise.resolve(null),
    ]);

    if (epicAchievements && epicAchievements.length > 0) {
      return NextResponse.json({
        ...gameDetails,
        achievements: epicAchievements,
        totalAchievements: epicAchievements.length,
        achievementsSource: "epic",
      });
    }

    return NextResponse.json(gameDetails);
  } catch (error: any) {
    console.error("Game API error:", error);
    return NextResponse.json(
      { error: "Impossible de charger les données du jeu.", details: error.message },
      { status: 500 }
    );
  }
}
