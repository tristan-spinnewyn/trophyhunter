// app/api/user/games/route.ts
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getUserOwnedGames } from "@/lib/db";
import { InvalidGameStatusError } from "@/lib/game-status/game-status.types";
import {
  handlePostOwnedGames,
  handlePatchOwnedGameStatus,
  handleDeleteOwnedGames,
} from "./handlers";
import { errorMessage } from "@/lib/error-message";

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
    return await handlePostOwnedGames(user.id, body);
  } catch (err: unknown) {
    const message = errorMessage(err, "Erreur de sauvegarde des jeux.");
    console.error("Save owned games error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const body = await req.json();
    return await handlePatchOwnedGameStatus(user.id, body);
  } catch (err: unknown) {
    if (err instanceof InvalidGameStatusError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    const message = errorMessage(err, "Erreur de mise à jour du statut.");
    console.error("Patch game status error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    return await handleDeleteOwnedGames(user.id, searchParams);
  } catch (err: unknown) {
    const message = errorMessage(err, "Erreur lors de la suppression du jeu.");
    console.error("Delete owned game error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
