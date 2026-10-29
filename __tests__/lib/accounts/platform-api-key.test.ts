// __tests__/lib/accounts/platform-api-key.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { resolvePlatformApiKey } from "@/lib/accounts/platform-api-key";
import { initDatabase, setDbForTesting, createUser, saveUserPlatformAccount } from "@/lib/db";

function storeKey(userId: string, platform: "steam" | "xbox", key: string) {
  saveUserPlatformAccount(
    userId,
    {
      platform,
      username: "player",
      displayName: "Player",
      connectedAt: new Date().toISOString(),
      stats: { gamesOwned: 0, totalAchievements: 0, completedGames: 0 },
    },
    key
  );
}

describe("resolvePlatformApiKey", () => {
  beforeEach(() => {
    setDbForTesting(initDatabase(":memory:"));
    vi.stubEnv("STEAM_API_KEY", " server-steam ");
    vi.stubEnv("OPENXBL_API_KEY", "");
    vi.stubEnv("XBL_API_KEY", "");
    vi.stubEnv("XBOX_API_KEY", "server-xbox");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("never hands the server key to an anonymous caller", () => {
    expect(resolvePlatformApiKey("steam", { userId: undefined })).toBe("");
    expect(resolvePlatformApiKey("xbox", { userId: undefined })).toBe("");
  });

  it("still uses a key the anonymous caller provided themselves", () => {
    expect(resolvePlatformApiKey("steam", { userId: undefined, providedKey: "own-key" })).toBe("own-key");
  });

  it("prefers the provided key, then the user's stored key, then the server key", () => {
    const user = createUser("keyowner", "password123");
    expect(resolvePlatformApiKey("steam", { userId: user.id })).toBe("server-steam");
    expect(resolvePlatformApiKey("xbox", { userId: user.id })).toBe("server-xbox");

    storeKey(user.id, "steam", "stored-steam");
    expect(resolvePlatformApiKey("steam", { userId: user.id })).toBe("stored-steam");
    expect(resolvePlatformApiKey("steam", { userId: user.id, providedKey: "own-key" })).toBe("own-key");
  });

  it("reads the Xbox server key from the first configured variable", () => {
    const user = createUser("xboxowner", "password123");
    vi.stubEnv("OPENXBL_API_KEY", "openxbl");
    expect(resolvePlatformApiKey("xbox", { userId: user.id })).toBe("openxbl");
  });

  it("returns an empty key when nothing is configured", () => {
    const user = createUser("nokeys", "password123");
    vi.stubEnv("STEAM_API_KEY", "");
    expect(resolvePlatformApiKey("steam", { userId: user.id })).toBe("");
  });
});
