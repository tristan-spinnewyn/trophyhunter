import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import {
  getUserOwnedGames,
  saveUserOwnedGames,
  removeUserOwnedGame,
  removeUserPlatformGames,
  clearAllUserData,
} from "@/lib/db";
import type { PlatformType, OwnedGame } from "@/lib/types";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const games = getUserOwnedGames(user.id);
  return NextResponse.json({ games });
}

export async function POST(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const gamesList: OwnedGame[] = Array.isArray(body?.games)
      ? body.games
      : body?.game
      ? [body.game]
      : [];

    if (gamesList.length === 0 && !body?.replacePlatform) {
      return NextResponse.json({ error: "Aucun jeu fourni." }, { status: 400 });
    }

    if (body?.replacePlatform) {
      removeUserPlatformGames(user.id, body.replacePlatform as PlatformType);
    }

    if (gamesList.length > 0) {
      saveUserOwnedGames(user.id, gamesList);
    }

    const updatedGames = getUserOwnedGames(user.id);
    return NextResponse.json({
      success: true,
      count: gamesList.length,
      games: updatedGames,
    });
  } catch (err: any) {
    console.error("Save owned games error:", err);
    return NextResponse.json(
      { error: err.message || "Erreur de sauvegarde des jeux." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const appId = searchParams.get("appId");
    const platform = searchParams.get("platform") as PlatformType | null;
    const all = searchParams.get("all");

    if (all === "true") {
      clearAllUserData(user.id);
      return NextResponse.json({ success: true, games: [] });
    }

    if (!appId && platform) {
      removeUserPlatformGames(user.id, platform);
      return NextResponse.json({
        success: true,
        games: getUserOwnedGames(user.id),
      });
    }

    if (!appId) {
      return NextResponse.json({ error: "Paramètre appId requis." }, { status: 400 });
    }

    removeUserOwnedGame(user.id, Number(appId), platform || undefined);
    return NextResponse.json({
      success: true,
      games: getUserOwnedGames(user.id),
    });
  } catch (err: any) {
    console.error("Delete owned game error:", err);
    return NextResponse.json(
      { error: err.message || "Erreur lors de la suppression du jeu." },
      { status: 500 }
    );
  }
}

