// __tests__/api/profile/epic_basic.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/profile/epic/route";
import { profileSyncRequest } from "../../helpers/profileRequests";
import { initDatabase, setDbForTesting } from "@/lib/db";
import { textResponse } from "../../helpers/responses";

describe("POST /api/profile/epic Basic & Validation", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setDbForTesting(initDatabase(":memory:"));
  });

  it("returns 400 when both user and code parameters are missing", async () => {
    const res = await POST(profileSyncRequest("epic"));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("authorizationToken");
  });

  it("ignores an authorization code passed in the query string", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");
    const res = await POST(new Request("http://localhost:3000/api/profile/epic?code=leaked-code", { method: "POST", body: "{}" }));

    expect(res.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("configures Epic account in username-only mode without credentials", async () => {
    const res = await POST(profileSyncRequest("epic", { user: "EpicGamer99" }));
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.account.platform).toBe("epic");
    expect(data.account.username).toBe("EpicGamer99");
    expect(data.notice).toContain("Compte Epic Games configuré");
  });

  it("returns 401 when Epic authorization code is expired or invalid", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      textResponse('{"errorCode":"errors.com.epicgames.account.oauth.authorization_code_not_found"}', 400)
    );

    const res = await POST(profileSyncRequest("epic", {}, { "x-authorization-token": "invalid-code" }));
    expect(res.status).toBe(401);

    const data = await res.json();
    expect(data.error).toContain("Code d'autorisation Epic Games expiré ou invalide");
  });

  it("parses JSON string and redirect URL authorizationToken", async () => {
    vi.spyOn(global, "fetch").mockImplementation(async () =>
      textResponse('{"errorCode":"invalid_code"}', 400)
    );

    const jsonToken = JSON.stringify({ authorizationCode: "code_from_json_123" });
    const res1 = await POST(profileSyncRequest("epic", {}, { "x-authorization-token": jsonToken }));
    expect(res1.status).toBe(401);

    const redirectUrl = "https://localhost/?code=a1b2c3d4e5f6";
    const res2 = await POST(profileSyncRequest("epic", {}, { "x-authorization-token": redirectUrl }));
    expect(res2.status).toBe(401);
  });
});
