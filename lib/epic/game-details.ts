// lib/epic/game-details.ts
import type { Achievement } from "@/lib/types";
import { getEpicGameSandbox, saveEpicGameSandboxes } from "@/lib/db";
import { loadStoredEpicCredentials, withEpicCredentials } from "./credentials";
import { getEpicGameAchievements } from "./game-achievements";
import { persistEpicGameSync } from "./sync-progress";

export async function getEpicAchievementsForUser(
  userId: string,
  appId: number,
  gameName: string
): Promise<Achievement[] | null> {
  const creds = loadStoredEpicCredentials(userId);
  if (!creds) return null;

  const knownSandbox = getEpicGameSandbox(userId, appId);
  try {
    const { result } = await withEpicCredentials(
      creds,
      (c) =>
        getEpicGameAchievements({
          appId,
          gameName,
          accessToken: c.accessToken,
          accountId: c.accountId,
          sandboxId: knownSandbox,
        }),
      userId
    );
    if (!result || result.achievements.length === 0) return null;

    if (result.sandboxId !== knownSandbox) {
      saveEpicGameSandboxes(userId, [{ appId, sandboxId: result.sandboxId }]);
    }

    if (result.unlockedIds.length > 0 || result.achievements.length > 0) {
      persistEpicGameSync(
        { id: userId, username: "", displayName: "", createdAt: "" },
        appId,
        result.unlockedIds,
        result.achievements.length,
        result.totalUnlocked
      );
    }

    return result.achievements;
  } catch {
    return null;
  }
}

