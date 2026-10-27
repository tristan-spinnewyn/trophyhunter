// __tests__/epic/credentials_tokens.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  EPIC_ACCOUNT_API,
  exchangeEpicAuthInput,
  refreshEpicAccessToken,
  requestEpicToken,
  verifyEpicAccessToken,
} from "@/lib/epic/credentials";
import { jsonResponse } from "../helpers/responses";

describe("verifyEpicAccessToken", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the account behind a valid bearer token", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce(
      jsonResponse({ account_id: "acc_v", display_name: "Snake" })
    );

    expect(await verifyEpicAccessToken("tok_v")).toEqual({ accountId: "acc_v", displayName: "Snake" });
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe(`${EPIC_ACCOUNT_API}/verify`);
    expect(init?.headers).toEqual({ Authorization: "Bearer tok_v" });
  });

  it("falls back to the camelCase displayName field", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(jsonResponse({ account_id: "acc_c", displayName: "Camel" }));

    expect(await verifyEpicAccessToken("tok_c")).toEqual({ accountId: "acc_c", displayName: "Camel" });
  });

  it("returns null when the token is rejected or the request throws", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(jsonResponse({ error: "invalid" }, 401));
    expect(await verifyEpicAccessToken("bad")).toBeNull();

    vi.spyOn(global, "fetch").mockRejectedValueOnce(new Error("Network error"));
    expect(await verifyEpicAccessToken("offline")).toBeNull();
  });
});

describe("requestEpicToken", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("posts form-encoded params to the token endpoint with Basic client auth", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce(jsonResponse({ access_token: "a" }));

    const res = await requestEpicToken({ grant_type: "refresh_token", refresh_token: "r" });

    expect(res.ok).toBe(true);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe(`${EPIC_ACCOUNT_API}/token`);
    expect(init?.method).toBe("POST");
    expect(init?.headers).toEqual({
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from("34a02cf8f4414e29b15921876da36f9a:daafbccc737745039dffe53d94fc76cf").toString("base64")}`,
    });
    expect(init?.body).toBe("grant_type=refresh_token&refresh_token=r");
  });
});

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
