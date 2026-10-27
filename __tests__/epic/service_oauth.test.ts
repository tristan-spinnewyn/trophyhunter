// __tests__/epic/service_oauth.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { initDatabase, setDbForTesting, createUser } from "@/lib/db";
import { storeEpicCredentials } from "@/lib/epic/credentials";
import { syncEpicProfileWithOAuth } from "@/lib/epic/profile-sync";
import { jsonResponse } from "../helpers/responses";

describe("Epic Service OAuth Synchronization", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setDbForTesting(initDatabase(":memory:"));
  });

  it("syncs with stored credentials when token is valid", async () => {
    const user = createUser("epic_stored_user", "pass123");
    storeEpicCredentials(user.id, {
      accessToken: "stored_access_valid",
      refreshToken: "stored_refresh_val",
      accountId: "stored_acc_123",
    });

    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(
        jsonResponse({ account_id: "stored_acc_123", display_name: "StoredPro" })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          records: [
            { appName: "Hades", title: "Hades", namespace: "ns_hades", catalogItemId: "cat_hades" },
          ],
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          data: { PlayerAchievement: { playerAchievementGameRecords: { records: [] } } },
        })
      );

    const res = await syncEpicProfileWithOAuth("", undefined, user);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.discoveredGames).toHaveLength(1);
      expect(res.discoveredGames[0].name).toBe("Hades");
    }
  });

  it("refreshes token when access token is expired", async () => {
    const user = createUser("epic_refresh_user", "pass123");
    storeEpicCredentials(user.id, {
      accessToken: "expired_access",
      refreshToken: "valid_refresh_code",
      accountId: "acc_refresh_123",
    });

    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(jsonResponse({ error: "expired" }, 401))
      .mockResolvedValueOnce(
        jsonResponse({
          access_token: "new_refreshed_access",
          refresh_token: "new_refresh_tok",
          account_id: "acc_refresh_123",
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          records: [
            { appName: "Celeste", title: "Celeste", namespace: "ns_celeste", catalogItemId: "cat_celeste" },
          ],
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          data: { PlayerAchievement: { playerAchievementGameRecords: { records: [] } } },
        })
      );

    const res = await syncEpicProfileWithOAuth("", undefined, user);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.discoveredGames).toHaveLength(1);
      expect(res.discoveredGames[0].name).toBe("Celeste");
    }
  });
});
