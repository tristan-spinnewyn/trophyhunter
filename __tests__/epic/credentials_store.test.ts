// __tests__/epic/credentials_store.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { initDatabase, setDbForTesting, createUser } from "@/lib/db";
import {
  loadStoredEpicCredentials,
  storeEpicCredentials,
  withEpicCredentials,
  EpicAuthError,
} from "@/lib/epic/credentials";
import { jsonResponse } from "../helpers/responses";

describe("Epic Credentials Persistence & Wrapper", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setDbForTesting(initDatabase(":memory:"));
  });

  it("stores and loads credentials from SQLite", () => {
    const user = createUser("creds_user", "pass123");
    storeEpicCredentials(user.id, {
      accessToken: "stored_token",
      refreshToken: "stored_refresh",
      accountId: "stored_acc",
      displayName: "StoredHero",
    });

    const loaded = loadStoredEpicCredentials(user.id);
    expect(loaded).toEqual({
      accessToken: "stored_token",
      refreshToken: "stored_refresh",
      accountId: "stored_acc",
    });
  });

  it("refreshes token on EpicAuthError within withEpicCredentials", async () => {
    const user = createUser("refresh_tester", "pass123");
    const creds = {
      accessToken: "expired_token",
      refreshToken: "valid_refresh",
      accountId: "acc_refresh",
    };

    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      jsonResponse({
        access_token: "fresh_token_123",
        refresh_token: "fresh_refresh_456",
        account_id: "acc_refresh",
      })
    );

    let attempts = 0;
    const { result, expired } = await withEpicCredentials(
      creds,
      async (currentCredentials) => {
        attempts++;
        if (attempts === 1) {
          throw new EpicAuthError();
        }
        return `success with ${currentCredentials.accessToken}`;
      },
      user.id
    );

    expect(attempts).toBe(2);
    expect(expired).toBe(false);
    expect(result).toBe("success with fresh_token_123");
  });
});
