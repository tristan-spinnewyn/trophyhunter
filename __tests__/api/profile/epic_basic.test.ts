// __tests__/api/profile/epic_basic.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/profile/epic/route";
import { initDatabase, setDbForTesting } from "@/lib/db";
import { textResponse } from "../../helpers/responses";

describe("GET /api/profile/epic Basic & Validation", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setDbForTesting(initDatabase(":memory:"));
  });

  it("returns 400 when both user and code parameters are missing", async () => {
    const res = await GET(new Request("http://localhost:3000/api/profile/epic"));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("authorizationToken");
  });

  it("configures Epic account in username-only mode without credentials", async () => {
    const res = await GET(new Request("http://localhost:3000/api/profile/epic?user=EpicGamer99"));
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

    const res = await GET(new Request("http://localhost:3000/api/profile/epic?code=invalid-code"));
    expect(res.status).toBe(401);

    const data = await res.json();
    expect(data.error).toContain("Code d'autorisation Epic Games expiré ou invalide");
  });

  it("parses JSON string and redirect URL authorizationToken", async () => {
    vi.spyOn(global, "fetch").mockImplementation(async () =>
      textResponse('{"errorCode":"invalid_code"}', 400)
    );

    const jsonToken = JSON.stringify({ authorizationCode: "code_from_json_123" });
    const res1 = await GET(
      new Request(`http://localhost:3000/api/profile/epic?authorizationToken=${encodeURIComponent(jsonToken)}`)
    );
    expect(res1.status).toBe(401);

    const redirectUrl = "https://localhost/?code=a1b2c3d4e5f6";
    const res2 = await GET(
      new Request(`http://localhost:3000/api/profile/epic?authorizationToken=${encodeURIComponent(redirectUrl)}`)
    );
    expect(res2.status).toBe(401);
  });
});
