// __tests__/api/general/sync_errors.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/sync/route";
import { textResponse } from "../../helpers/responses";

describe("GET /api/sync Error Handling", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 400 when user or appId is missing or invalid", async () => {
    expect((await GET(new Request("http://localhost:3000/api/sync?appId=367520"))).status).toBe(400);
    expect((await GET(new Request("http://localhost:3000/api/sync?user=testuser"))).status).toBe(400);
    expect((await GET(new Request("http://localhost:3000/api/sync?platform=epic"))).status).toBe(400);
  });

  it("detects private profile and returns 403", async () => {
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(textResponse("<html><body>Ce profil est privé</body></html>"))
      .mockResolvedValueOnce(textResponse(""));

    const req = new Request("http://localhost:3000/api/sync?user=76561198000000000&appId=367520");
    const res = await GET(req);
    expect(res.status).toBe(403);
    expect((await res.json()).isPrivate).toBe(true);
  });

  it("handles 404 profile not found", async () => {
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(textResponse("Not Found", 404)) // profile achievements page
      .mockResolvedValueOnce(textResponse("Not Found", 404)); // game schema, fetched in parallel

    const req = new Request("http://localhost:3000/api/sync?user=nonexistent_user&appId=123");
    const res = await GET(req);
    expect(res.status).toBe(404);
  });
});
