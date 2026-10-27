// __tests__/epic/resolve_tokens.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { initDatabase, setDbForTesting, createUser } from "@/lib/db";
import {
  EPIC_ACCOUNT_API,
  loadStoredEpicCredentials,
  resolveEpicTokens,
  storeEpicCredentials,
} from "@/lib/epic/credentials";
import { jsonResponse, textResponse } from "../helpers/responses";

const AUTH_CODE_URL =
  "https://www.epicgames.com/id/api/redirect?clientId=34a02cf8f4414e29b15921876da36f9a&responseType=code";

describe("resolveEpicTokens", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setDbForTesting(initDatabase(":memory:"));
  });

  it("accepts a verified eg1 access token without exchanging it", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce(
      jsonResponse({ account_id: "acc_eg1", display_name: "Verified" })
    );

    const res = await resolveEpicTokens("eg1~direct_token", "RawName");

    expect(res.resolved).toEqual({
      accessToken: "eg1~direct_token",
      accountId: "acc_eg1",
      refreshToken: "",
      displayName: "Verified",
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0][0]).toBe(`${EPIC_ACCOUNT_API}/verify`);
  });

  it("falls back to the code exchange when an eg1 token fails verification", async () => {
    const fetchSpy = vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(jsonResponse({ error: "invalid" }, 401))
      .mockResolvedValueOnce(
        jsonResponse({ access_token: "exchanged", account_id: "acc_x", refresh_token: "ref_x" })
      );

    const res = await resolveEpicTokens("eg1~stale_token");

    expect(res.resolved).toEqual({
      accessToken: "exchanged",
      accountId: "acc_x",
      refreshToken: "ref_x",
      displayName: "Joueur Epic",
    });
    expect(fetchSpy.mock.calls[1][0]).toBe(`${EPIC_ACCOUNT_API}/token`);
  });

  it("exchanges an authorization code with Basic client auth", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce(
      jsonResponse({
        access_token: "code_access",
        account_id: "acc_code",
        refresh_token: "code_refresh",
        displayName: "CodeUser",
      })
    );

    const res = await resolveEpicTokens("abc123", "RawName");

    expect(res.resolved).toEqual({
      accessToken: "code_access",
      accountId: "acc_code",
      refreshToken: "code_refresh",
      displayName: "CodeUser",
    });
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe(`${EPIC_ACCOUNT_API}/token`);
    expect((init?.headers as Record<string, string>).Authorization).toMatch(/^Basic /);
    expect(String(init?.body)).toBe("grant_type=authorization_code&code=abc123&token_type=eg1");
  });

  it("returns a 401 with the Epic response body when the code exchange is rejected", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(textResponse("invalid_grant", 400));

    const res = await resolveEpicTokens("bad_code");

    expect(res.resolved).toBeUndefined();
    expect(res.errorStatus).toBe(401);
    expect(res.errorMsg).toContain(AUTH_CODE_URL);
    expect(res.errorDetails).toBe("invalid_grant");
  });

  it("returns a 401 without any request when there is no code and no user", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const res = await resolveEpicTokens("");

    expect(res.errorStatus).toBe(401);
    expect(res.errorMsg).toContain(AUTH_CODE_URL);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("reuses stored credentials that still verify", async () => {
    const user = createUser("stored_ok", "pass123");
    storeEpicCredentials(user.id, { accessToken: "stored_access", refreshToken: "stored_ref", accountId: "acc_s" });
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      jsonResponse({ account_id: "acc_s", display_name: "StoredName" })
    );

    const res = await resolveEpicTokens("", undefined, user);

    expect(res.resolved).toEqual({
      accessToken: "stored_access",
      accountId: "acc_s",
      refreshToken: "stored_ref",
      displayName: "StoredName",
    });
  });

  it("refreshes and persists stored credentials that no longer verify", async () => {
    const user = createUser("stored_expired", "pass123");
    storeEpicCredentials(user.id, { accessToken: "old_access", refreshToken: "old_ref", accountId: "acc_r" });
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(jsonResponse({ error: "expired" }, 401))
      .mockResolvedValueOnce(jsonResponse({ access_token: "new_access", refresh_token: "new_ref", account_id: "acc_r" }));

    const res = await resolveEpicTokens("", "RawName", user);

    expect(res.resolved).toEqual({
      accessToken: "new_access",
      accountId: "acc_r",
      refreshToken: "new_ref",
      displayName: "RawName",
    });
    expect(loadStoredEpicCredentials(user.id)?.accessToken).toBe("new_access");
  });
});
