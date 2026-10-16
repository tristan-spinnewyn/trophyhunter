// app/api/user/games/handlers.ts

import { NextResponse } from "next/server";
import {
  getUserOwnedGames,
  saveUserOwnedGames,
  removeUserOwnedGame,
  removeUserPlatformGames,
  clearAllUserData,
} from "@/lib/db";
import type { PlatformType, OwnedGame } from "@/lib/types";

export async function handlePostOwnedGames(userId: string, body: any) {
  const gamesList: OwnedGame[] = Array.isArray(body?.games)
    ? body.games
    : body?.game
    ? [body.game]
    : [];

  if (gamesList.length === 0 && !body?.replacePlatform) {
    return NextResponse.json({ error: "Aucun jeu fourni." }, { status: 400 });
  }

  if (body?.replacePlatform) {
    removeUserPlatformGames(userId, body.replacePlatform as PlatformType);
  }

  if (gamesList.length > 0) {
    saveUserOwnedGames(userId, gamesList);
  }

  const updatedGames = getUserOwnedGames(userId);
  return NextResponse.json({
    success: true,
    count: gamesList.length,
    games: updatedGames,
  });
}

export async function handleDeleteOwnedGames(userId: string, searchParams: URLSearchParams) {
  const appId = searchParams.get("appId");
  const platform = searchParams.get("platform") as PlatformType | null;
  const all = searchParams.get("all");

  if (all === "true") {
    clearAllUserData(userId);
    return NextResponse.json({ success: true, games: [] });
  }

  if (!appId && platform) {
    removeUserPlatformGames(userId, platform);
    return NextResponse.json({
      success: true,
      games: getUserOwnedGames(userId),
    });
  }

  if (!appId) {
    return NextResponse.json({ error: "Paramètre appId requis." }, { status: 400 });
  }

  removeUserOwnedGame(userId, Number(appId), platform || undefined);
  return NextResponse.json({
    success: true,
    games: getUserOwnedGames(userId),
  });
}
