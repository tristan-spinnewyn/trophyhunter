// __tests__/lib/context/useUserDataSync.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchRemoteUserData, persistGameToServer } from "@/context/useUserDataSync";
import type { OwnedGame, User } from "@/lib/types";

describe("useUserDataSync", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches remote user data and applies payload on success", async () => {
    const mockPayload = { games: [], wishlist: [10, 20] };
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(mockPayload), { status: 200 })
    );
    const applySpy = vi.fn();

    await fetchRemoteUserData(applySpy);

    expect(globalThis.fetch).toHaveBeenCalledWith("/api/user/sync");
    expect(applySpy).toHaveBeenCalledWith(mockPayload);
  });

  it("ignores non-ok responses or network errors during fetchRemoteUserData", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("Unauthorized", { status: 401 })
    );
    const applySpy = vi.fn();

    await fetchRemoteUserData(applySpy);
    expect(applySpy).not.toHaveBeenCalled();

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Network failure"));

    await fetchRemoteUserData(applySpy);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("persists game to server only when currentUser is present", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    );
    const game: OwnedGame = {
      appId: 400,
      name: "Portal",
      headerImg: "img",
      platform: "steam",
      totalAchievements: 15,
      unlockedCount: 5,
      addedAt: "2026-01-01",
    };
    const user: User = {
      id: 1,
      username: "tester",
      displayName: "Tester",
      createdAt: "2026-01-01",
    };

    await persistGameToServer(null, game);
    expect(fetchSpy).not.toHaveBeenCalled();

    await persistGameToServer(user, game);
    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/user/games",
      expect.objectContaining({
        method: "POST",
      })
    );
  });
});
