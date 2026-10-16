// app/game/[id]/hooks/fetchGameData.ts

import type { GameDetails, UserGameProgress, PlatformType } from "@/lib/types";

export async function fetchRemoteUserProgress(
  appId: number,
  platform: PlatformType
): Promise<UserGameProgress | null> {
  try {
    const progRes = await fetch(`/api/user/progress?appId=${appId}&platform=${platform}`);
    if (progRes.ok) {
      const progData = await progRes.json();
      return progData?.progress || null;
    }
  } catch {}
  return null;
}

export async function fetchGameDetailsApi(
  appId: number,
  name?: string,
  platform?: PlatformType
): Promise<GameDetails> {
  const query = new URLSearchParams();
  if (name) query.set("name", name);
  if (platform) query.set("platform", platform);
  const queryString = query.toString() ? `?${query.toString()}` : "";

  const res = await fetch(`/api/game/${appId}${queryString}`);
  if (!res.ok) {
    throw new Error("Impossible de récupérer les succès du jeu.");
  }
  return res.json();
}
