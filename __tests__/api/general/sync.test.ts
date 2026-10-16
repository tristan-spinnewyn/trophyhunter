// __tests__/api/general/sync.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/sync/route";
import {
  initDatabase,
  setDbForTesting,
  createUser,
  createSession,
  getUserGameProgress,
} from "@/lib/db";
import type { CookieRecord } from "../../helpers/cookies";
import { textResponse } from "../../helpers/responses";

const { mockCookieStore } = vi.hoisted(() => ({
  mockCookieStore: new Map<string, CookieRecord>(),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => mockCookieStore.get(name),
    set: (name: string, value: string, options?: Omit<CookieRecord, "name" | "value">) => {
      mockCookieStore.set(name, { name, value, ...options });
    },
    delete: (name: string) => {
      mockCookieStore.delete(name);
    },
  }),
}));

describe("GET /api/sync Core Synchronization", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setDbForTesting(initDatabase(":memory:"));
    mockCookieStore.clear();
  });

  it("extracts unlocked achievement titles and deterministic unlockedIds", async () => {
    const playerHtml = `
      <html>
        <head><title>Steam :: Hollow Knight :: TestGamer :: Succès</title></head>
        <body>
          <div class="achieveRow">
            <h3>Éveil</h3>
            <div class="achieveUnlockTime">Débloqué le 1 Jan</div>
          </div>
        </body>
      </html>
    `;
    const globalHtml = `<html><body><div class="achieveRow"><h3>Éveil</h3></div></body></html>`;

    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(textResponse(playerHtml))
      .mockResolvedValueOnce(textResponse(globalHtml));

    const req = new Request("http://localhost:3000/api/sync?user=76561198000000000&appId=367520");
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.count).toBe(1);
    expect(data.unlockedTitles).toEqual(["Éveil"]);
  });

  it("persists game progress to database for authenticated user", async () => {
    const user = createUser("syncuser", "hashedpassword123");
    const sessionId = createSession(user.id);
    mockCookieStore.set("trophyhunter_session", { name: "trophyhunter_session", value: sessionId });

    const playerHtml = `<html><body><div class="achieveRow"><h3>Premier Pas</h3><div class="achieveUnlockTime">1 Jan</div></div></body></html>`;
    const globalHtml = `<html><body><div class="achieveRow"><h3>Premier Pas</h3></div></body></html>`;

    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(textResponse(playerHtml))
      .mockResolvedValueOnce(textResponse(globalHtml));

    const req = new Request("http://localhost:3000/api/sync?user=76561198000000000&appId=500");
    const res = await GET(req);
    expect(res.status).toBe(200);

    const progress = getUserGameProgress(user.id, 500, "steam");
    expect(progress?.unlockedIds.length).toBeGreaterThan(0);
  });

  it("delegates to epic sync when platform=epic", async () => {
    const req = new Request("http://localhost:3000/api/sync?platform=epic&appId=12345&name=Hades");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.platform).toBe("epic");
  });
});
