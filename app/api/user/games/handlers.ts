// app/api/user/games/handlers.ts
import { NextResponse } from "next/server";
import {
  getUserOwnedGames,
  saveUserOwnedGames,
  removeUserOwnedGame,
  removeUserPlatformGames,
  clearAllUserData,
  setUserGameStatus,
  setUserGameBacklogRank,
} from "@/lib/db";
import { assertValidGameStatus } from "@/lib/game-status/game-status.services";
import type { PlatformType, OwnedGame } from "@/lib/types";

interface PostOwnedGamesBody {
  readonly games?: OwnedGame[];
  readonly game?: OwnedGame;
  readonly replacePlatform?: PlatformType;
}

interface PatchGameStatusBody {
  readonly appId?: number;
  readonly platform?: PlatformType;
  readonly status?: string;
  readonly name?: string;
}

interface PatchBacklogRankBody {
  readonly appId?: number;
  readonly platform?: PlatformType;
  readonly backlogRank?: unknown;
}

export async function handlePostOwnedGames(userId: string, body: PostOwnedGamesBody) {
  const gamesList: OwnedGame[] = Array.isArray(body?.games)
    ? body.games
    : body?.game
    ? [body.game]
    : [];

  if (gamesList.length === 0 && !body?.replacePlatform) {
    return NextResponse.json({ error: "Aucun jeu fourni." }, { status: 400 });
  }

  if (body?.replacePlatform) {
    removeUserPlatformGames(userId, body.replacePlatform);
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

export async function handlePatchOwnedGameStatus(userId: string, body: PatchGameStatusBody) {
  const appId = Number(body?.appId);
  const platform = (body?.platform || "steam") as PlatformType;
  if (!appId || Number.isNaN(appId)) {
    return NextResponse.json({ error: "Paramètre appId requis." }, { status: 400 });
  }
  const validStatus = assertValidGameStatus(body?.status);
  setUserGameStatus(userId, appId, platform, validStatus, body?.name);
  return NextResponse.json({
    success: true,
    appId,
    platform,
    status: validStatus,
    games: getUserOwnedGames(userId),
  });
}

/** Queues a game in the backlog at `backlogRank`, or takes it out of the queue with `null`. */
export async function handlePatchBacklogRank(userId: string, body: PatchBacklogRankBody) {
  const appId = Number(body?.appId);
  const platform = (body?.platform || "steam") as PlatformType;
  const rank = body?.backlogRank;
  if (!appId || Number.isNaN(appId)) {
    return NextResponse.json({ error: "Paramètre appId requis." }, { status: 400 });
  }
  if (rank !== null && !Number.isInteger(rank)) {
    return NextResponse.json({ error: "Paramètre backlogRank invalide." }, { status: 400 });
  }
  setUserGameBacklogRank(userId, appId, platform, rank as number | null);
  return NextResponse.json({ success: true, appId, platform, backlogRank: rank });
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
