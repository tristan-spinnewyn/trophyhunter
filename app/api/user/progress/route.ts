// app/api/user/progress/route.ts
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import {
  saveUserGameProgress,
  getUserGameProgress,
  resetUserGameProgress,
} from "@/lib/db";
import { errorMessage } from "@/lib/error-message";
import { normalizePinnedIds } from "@/lib/hunting/pinned-targets.services";
import { sanitizeHuntingOverrideSafe } from "@/lib/hunting/hunting-override.services";
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
  return NextResponse.json({
    progress: progress || { unlockedIds: [], notes: {}, pinnedIds: [] },
  });
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

    const huntingMeta = sanitizeHuntingOverrideSafe(progress.huntingMeta);
    const gameProgress: UserGameProgress = {
      unlockedIds: Array.isArray(progress.unlockedIds) ? progress.unlockedIds : [],
      notes: typeof progress.notes === "object" && progress.notes !== null ? progress.notes : {},
      pinnedIds: normalizePinnedIds(progress.pinnedIds),
      ...(huntingMeta ? { huntingMeta } : {}),
      // Only explicit activity carries a date; syncs and note edits must not date the game.
      ...(typeof progress.lastPlayed === "string" ? { lastPlayed: progress.lastPlayed } : {}),
    };

    saveUserGameProgress(user.id, Number(appId), platform as PlatformType, gameProgress);

    return NextResponse.json({ success: true, progress: gameProgress });
  } catch (err) {
    console.error("Save progress error:", err);
    return NextResponse.json(
      { error: errorMessage(err, "Erreur de sauvegarde de la progression.") },
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
  } catch (err) {
    console.error("Reset progress error:", err);
    return NextResponse.json(
      { error: errorMessage(err, "Erreur lors de la réinitialisation.") },
      { status: 500 }
    );
  }
}
