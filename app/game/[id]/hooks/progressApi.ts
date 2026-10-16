// app/game/[id]/hooks/progressApi.ts

import type { PlatformType, UserGameProgress } from "@/lib/types";

export async function saveProgressApi(appId: number, platform: PlatformType, progress: UserGameProgress): Promise<void> {
  try {
    await fetch("/api/user/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appId, platform, progress }),
    });
  } catch (err) {
    console.error("Failed to persist progress:", err);
  }
}

export async function deleteProgressApi(appId: number, platform: PlatformType): Promise<void> {
  try {
    await fetch(`/api/user/progress?appId=${appId}&platform=${platform}`, { method: "DELETE" });
  } catch {}
}
