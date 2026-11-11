// __tests__/lib/accounts/server-sync.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { initDatabase, setDbForTesting, createUser, saveUserPlatformAccount, getUserPlatformApiKey } from "@/lib/db";
import type { PlatformAccount, PlatformType } from "@/lib/types";

const mocks = vi.hoisted(() => ({
  syncSteamProfile: vi.fn(),
  fetchGogProfile: vi.fn(),
  fetchXboxProfileLive: vi.fn(),
  syncEpicProfileWithOAuth: vi.fn(),
  loadStoredEpicCredentials: vi.fn(),
}));

vi.mock("@/lib/steam/profile-sync", () => ({ syncSteamProfile: mocks.syncSteamProfile }));
vi.mock("@/lib/gog/service", () => ({ fetchGogProfile: mocks.fetchGogProfile }));
vi.mock("@/lib/xbox/service", () => ({ fetchXboxProfileLive: mocks.fetchXboxProfileLive }));
vi.mock("@/lib/epic/profile-sync", () => ({ syncEpicProfileWithOAuth: mocks.syncEpicProfileWithOAuth }));
vi.mock("@/lib/epic/credentials", () => ({ loadStoredEpicCredentials: mocks.loadStoredEpicCredentials }));

import { syncUserPlatforms } from "@/lib/accounts/server-sync";

function account(platform: PlatformType, username: string): PlatformAccount {
  return { platform, username, displayName: username, connectedAt: "2026-01-01T00:00:00.000Z", stats: { gamesOwned: 0, totalAchievements: 0, completedGames: 0 } };
}

describe("syncUserPlatforms", () => {
  let userId: string;

  beforeEach(() => {
    setDbForTesting(initDatabase(":memory:"));
    userId = createUser("AutoSyncUser", "password123").id;
    Object.values(mocks).forEach((m) => m.mockReset());
    vi.stubEnv("STEAM_API_KEY", "");
    vi.stubEnv("OPENXBL_API_KEY", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    setDbForTesting(null);
  });

  it("does nothing for a user without accounts", async () => {
    expect(await syncUserPlatforms(userId)).toEqual([]);
  });

  it("syncs Steam with the stored key and keeps that key", async () => {
    saveUserPlatformAccount(userId, account("steam", "76561198000000000"), "user-steam-key");
    mocks.syncSteamProfile.mockResolvedValue({ success: true });

    const results = await syncUserPlatforms(userId);

    expect(mocks.syncSteamProfile).toHaveBeenCalledWith("76561198000000000", "user-steam-key", userId);
    expect(results).toEqual([{ platform: "steam", status: "synced" }]);
  });

  it("syncs GOG with the stored token and stores the games", async () => {
    saveUserPlatformAccount(userId, account("gog", "gogger"), "gog-token");
    mocks.fetchGogProfile.mockResolvedValue({
      account: account("gog", "gogger"),
      discoveredGames: [{ appId: 5, name: "Gwent", headerImg: "", platform: "gog", totalAchievements: 0, unlockedCount: 0, addedAt: "2026-01-01T00:00:00.000Z" }],
      gameProgress: {},
    });

    const results = await syncUserPlatforms(userId);

    expect(mocks.fetchGogProfile).toHaveBeenCalledWith("gogger", "gog-token");
    expect(results).toEqual([{ platform: "gog", status: "synced" }]);
    expect(getUserPlatformApiKey(userId, "gog")).toBe("gog-token");
  });

  it("skips Xbox without any key", async () => {
    saveUserPlatformAccount(userId, account("xbox", "Gamer"));

    const results = await syncUserPlatforms(userId);

    expect(mocks.fetchXboxProfileLive).not.toHaveBeenCalled();
    expect(results).toEqual([{ platform: "xbox", status: "skipped" }]);
  });

  it("syncs Xbox with the server key without storing it", async () => {
    vi.stubEnv("OPENXBL_API_KEY", "server-xbox-key");
    saveUserPlatformAccount(userId, account("xbox", "Gamer"));
    mocks.fetchXboxProfileLive.mockResolvedValue({ account: account("xbox", "Gamer"), discoveredGames: [] });

    const results = await syncUserPlatforms(userId);

    expect(mocks.fetchXboxProfileLive).toHaveBeenCalledWith("Gamer", "server-xbox-key", expect.any(String));
    expect(results).toEqual([{ platform: "xbox", status: "synced" }]);
    expect(getUserPlatformApiKey(userId, "xbox")).toBeNull();
  });

  it("syncs Epic from the stored tokens, and skips it without them", async () => {
    saveUserPlatformAccount(userId, account("epic", "EpicGamer"));
    mocks.loadStoredEpicCredentials.mockReturnValueOnce(null);
    expect(await syncUserPlatforms(userId)).toEqual([{ platform: "epic", status: "skipped" }]);

    mocks.loadStoredEpicCredentials.mockReturnValue({ accessToken: "a", refreshToken: "r", accountId: "id" });
    mocks.syncEpicProfileWithOAuth.mockResolvedValue({ success: true });
    expect(await syncUserPlatforms(userId)).toEqual([{ platform: "epic", status: "synced" }]);
    expect(mocks.syncEpicProfileWithOAuth).toHaveBeenCalledWith("", undefined, expect.objectContaining({ id: userId }));
  });

  it("reports an Epic refusal as a failure", async () => {
    saveUserPlatformAccount(userId, account("epic", "EpicGamer"));
    mocks.loadStoredEpicCredentials.mockReturnValue({ accessToken: "a", refreshToken: "r", accountId: "id" });
    mocks.syncEpicProfileWithOAuth.mockResolvedValue({ success: false, status: 401, error: "expired" });

    expect(await syncUserPlatforms(userId)).toEqual([{ platform: "epic", status: "failed", error: "expired" }]);
  });

  it("keeps going when one platform fails", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    saveUserPlatformAccount(userId, account("steam", "76561198000000000"));
    saveUserPlatformAccount(userId, account("gog", "gogger"));
    mocks.syncSteamProfile.mockRejectedValue(new Error("Steam is down"));
    mocks.fetchGogProfile.mockResolvedValue({ account: account("gog", "gogger"), discoveredGames: [] });

    const results = await syncUserPlatforms(userId);

    expect(results).toContainEqual({ platform: "steam", status: "failed", error: "Steam is down" });
    expect(results).toContainEqual({ platform: "gog", status: "synced" });
  });
});
