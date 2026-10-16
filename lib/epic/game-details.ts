import type { Achievement } from "@/lib/types";
import { getEpicGameSandbox, saveEpicGameSandboxes } from "@/lib/db";
import { loadStoredEpicCredentials, withEpicCredentials } from "./credentials";
import { getEpicGameAchievements } from "./game-achievements";

/**
 * Returns the official Epic Games achievement list of a game for a user
 * with stored Epic credentials, or null if unavailable.
 */
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
    return result.achievements;
  } catch {
    return null;
  }
}
