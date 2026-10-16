import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import {
  getCollectionGames,
  addGameToCollection,
  removeGameFromCollection,
} from "@/lib/db";
import type { PlatformType } from "@/lib/types";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await params;
  const games = getCollectionGames(user.id, id);
  return NextResponse.json({ games });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const body = await req.json();
    const { appId, platform } = body || {};

    if (!appId || !platform) {
      return NextResponse.json(
        { error: "appId et platform sont requis." },
        { status: 400 }
      );
    }

    addGameToCollection(user.id, id, Number(appId), platform as PlatformType);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Add game to collection error:", err);
    return NextResponse.json(
      { error: err.message || "Impossible d'ajouter le jeu à la collection." },
      { status: 400 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const { searchParams } = new URL(req.url);
    const appId = searchParams.get("appId");
    const platform = searchParams.get("platform") as PlatformType;

    if (!appId || !platform) {
      return NextResponse.json(
        { error: "Paramètres appId et platform manquants." },
        { status: 400 }
      );
    }

    removeGameFromCollection(user.id, id, Number(appId), platform);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Remove game from collection error:", err);
    return NextResponse.json(
      { error: err.message || "Erreur lors du retrait du jeu." },
      { status: 400 }
    );
  }
}
