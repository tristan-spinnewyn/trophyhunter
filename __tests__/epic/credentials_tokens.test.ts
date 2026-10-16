// __tests__/epic/credentials_tokens.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { exchangeEpicAuthInput, refreshEpicAccessToken } from "@/lib/epic/credentials";
import { jsonResponse } from "../helpers/responses";

describe("Epic Token Exchange & Refresh", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("exchanges direct eg1 access token via verify endpoint", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      jsonResponse({ account_id: "epic_acc_eg1", display_name: "DirectUser" })
    );

    const creds = await exchangeEpicAuthInput("eg1~valid_token");
    expect(creds).not.toBeNull();
    expect(creds?.accountId).toBe("epic_acc_eg1");
    expect(creds?.accessToken).toBe("eg1~valid_token");
  });

  it("exchanges authorization code via token endpoint", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      jsonResponse({
        access_token: "exchanged_access",
        refresh_token: "exchanged_refresh",
        account_id: "epic_acc_code",
        displayName: "CodeUser",
      })
    );

    const creds = await exchangeEpicAuthInput("auth_code_xyz");
    expect(creds).not.toBeNull();
    expect(creds?.accessToken).toBe("exchanged_access");
    expect(creds?.refreshToken).toBe("exchanged_refresh");
  });

  it("returns null if token exchange fails", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      jsonResponse({ error: "invalid_grant" }, 400)
    );

    const creds = await exchangeEpicAuthInput("bad_code");
    expect(creds).toBeNull();
  });

  it("refreshes access token successfully", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      jsonResponse({
        access_token: "new_token",
        refresh_token: "new_refresh",
        account_id: "acc_1",
      })
    );

    const result = await refreshEpicAccessToken("old_refresh");
    expect(result).toEqual({
      accessToken: "new_token",
      refreshToken: "new_refresh",
      accountId: "acc_1",
    });
  });

  it("returns null when refresh request fails or throws", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      jsonResponse({ error: "invalid" }, 400)
    );
    expect(await refreshEpicAccessToken("invalid_refresh")).toBeNull();

    vi.spyOn(global, "fetch").mockRejectedValueOnce(new Error("Network error"));
    expect(await refreshEpicAccessToken("network_err")).toBeNull();
  });
});
