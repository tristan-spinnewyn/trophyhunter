// app/api/game/[id]/route.ts

import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getSteamGameDetails } from "@/lib/steam/game-details";
import { getEpicAchievementsForUser } from "@/lib/epic/game-details";
import { getGogAchievementsForUser } from "@/lib/gog/service";
import { getXboxAchievementsForUser } from "@/lib/xbox/game-details";

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
    } catch (authErr: unknown) {
      if (authErr instanceof Error) authUser = null;
    }

    const numericAppId = parseInt(appId, 10);
    const isEpic = platform === "epic" && !!authUser;
    const isGog = platform === "gog" && !!authUser;
    const isXbox = platform === "xbox";

    const [gameDetails, epicAchievements, gogAchievements] = await Promise.all([
      getSteamGameDetails({
        appId,
        nameParam,
        fastMode,
        authUserId: isEpic || isGog || isXbox ? undefined : authUser?.id,
      }),
      isEpic
        ? getEpicAchievementsForUser(authUser!.id, numericAppId, nameParam || "")
        : Promise.resolve(null),
      isGog
        ? getGogAchievementsForUser(authUser!.id, numericAppId)
        : Promise.resolve(null),
    ]);

    if (isXbox) {
      const xboxResult = await getXboxAchievementsForUser(
        authUser?.id,
        numericAppId,
        gameDetails.achievements
      );
      if (xboxResult && xboxResult.achievements.length > 0) {
        return NextResponse.json({
          ...gameDetails,
          achievements: xboxResult.achievements,
          totalAchievements: xboxResult.achievements.length,
          unlockedIds: xboxResult.unlockedIds,
          achievementsSource: "xbox",
        });
      }
    }

    if (epicAchievements && epicAchievements.length > 0) {
      return NextResponse.json({
        ...gameDetails,
        achievements: epicAchievements,
        totalAchievements: epicAchievements.length,
        achievementsSource: "epic",
      });
    }

    if (gogAchievements && gogAchievements.length > 0) {
      return NextResponse.json({
        ...gameDetails,
        achievements: gogAchievements,
        totalAchievements: gogAchievements.length,
        achievementsSource: "gog",
      });
    }

    return NextResponse.json(gameDetails);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur interne";
    console.error("Game API error:", error);
    return NextResponse.json(
      { error: "Impossible de charger les données du jeu.", details: message },
      { status: 500 }
    );
  }
}
