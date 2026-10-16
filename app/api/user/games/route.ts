// app/api/user/games/route.ts

import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getUserOwnedGames } from "@/lib/db";
import { handlePostOwnedGames, handleDeleteOwnedGames } from "./handlers";

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
    return await handleDeleteOwnedGames(user.id, searchParams);
  } catch (err: any) {
    console.error("Delete owned game error:", err);
    return NextResponse.json(
      { error: err.message || "Erreur lors de la suppression du jeu." },
      { status: 500 }
    );
  }
}
