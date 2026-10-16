import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import {
  saveUserGameProgress,
  getUserGameProgress,
  resetUserGameProgress,
} from "@/lib/db";
import type { PlatformType, UserGameProgress } from "@/lib/types";

export async function GET(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const appId = searchParams.get("appId");
  const platform = (searchParams.get("platform") || "steam") as PlatformType;

  if (!appId) {
    return NextResponse.json({ error: "appId requis" }, { status: 400 });
  }

  const progress = getUserGameProgress(user.id, Number(appId), platform);
  return NextResponse.json({ progress: progress || { unlockedIds: [], notes: {} } });
}

export async function POST(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { appId, platform = "steam", progress } = body || {};

    if (!appId || !progress) {
      return NextResponse.json(
        { error: "Paramètres appId et progress requis." },
        { status: 400 }
      );
    }

    const gameProgress: UserGameProgress = {
      unlockedIds: Array.isArray(progress.unlockedIds) ? progress.unlockedIds : [],
      notes: typeof progress.notes === "object" && progress.notes !== null ? progress.notes : {},
      lastPlayed: progress.lastPlayed || new Date().toISOString(),
    };

    saveUserGameProgress(user.id, Number(appId), platform as PlatformType, gameProgress);

    return NextResponse.json({ success: true, progress: gameProgress });
  } catch (err: any) {
    console.error("Save progress error:", err);
    return NextResponse.json(
      { error: err.message || "Erreur de sauvegarde de la progression." },
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
    const platform = (searchParams.get("platform") || "steam") as PlatformType;

    if (!appId) {
      return NextResponse.json({ error: "appId requis" }, { status: 400 });
    }

    resetUserGameProgress(user.id, Number(appId), platform);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Reset progress error:", err);
    return NextResponse.json(
      { error: err.message || "Erreur lors de la réinitialisation." },
      { status: 500 }
    );
  }
}
