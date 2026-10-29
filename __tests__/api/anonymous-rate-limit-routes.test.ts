// __tests__/api/anonymous-rate-limit-routes.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as searchGet } from "@/app/api/search/route";
import { GET as syncGet } from "@/app/api/sync/route";
import { GET as gameGet } from "@/app/api/game/[id]/route";
import { GET as gamePassGet } from "@/app/api/gamepass/pc/route";
import { POST as steamPost } from "@/app/api/profile/steam/route";
import { POST as xboxPost } from "@/app/api/profile/xbox/route";
import { POST as gogPost } from "@/app/api/profile/gog/route";
import { POST as epicPost } from "@/app/api/profile/epic/route";
import { checkRateLimit, extractClientKey, resetRateLimiterForTesting } from "@/lib/security";
import { ANONYMOUS_RATE_LIMIT, ANONYMOUS_RATE_LIMIT_SCOPE } from "@/lib/security/anonymous-rate-limit";
import { initDatabase, setDbForTesting, createUser, createSession } from "@/lib/db";
import type { CookieRecord } from "../helpers/cookies";
import { profileSyncRequest } from "../helpers/profileRequests";
import { jsonResponse } from "../helpers/responses";

const { mockCookieStore } = vi.hoisted(() => ({
  mockCookieStore: new Map<string, CookieRecord>(),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => mockCookieStore.get(name),
    set: (name: string, value: string) => { mockCookieStore.set(name, { name, value }); },
    delete: (name: string) => { mockCookieStore.delete(name); },
  }),
}));

/** Every public route an anonymous visitor can reach, each with a request that would call a third party. */
const publicRoutes: Array<[string, () => Promise<Response>]> = [
  ["GET /api/search", () => searchGet(new Request("http://localhost/api/search?q=portal"))],
  ["GET /api/sync", () => syncGet(new Request("http://localhost/api/sync?user=76561198000000000&appId=620"))],
  ["GET /api/game/[id]", () => gameGet(new Request("http://localhost/api/game/620"), { params: Promise.resolve({ id: "620" }) })],
  ["GET /api/gamepass/pc", () => gamePassGet(new Request("http://localhost/api/gamepass/pc?refresh=1"))],
  ["POST /api/profile/steam", () => steamPost(profileSyncRequest("steam", { user: "76561198000000000" }))],
  ["POST /api/profile/xbox", () => xboxPost(profileSyncRequest("xbox", { user: "MajorNelson", secret: "key" }))],
  ["POST /api/profile/gog", () => gogPost(profileSyncRequest("gog", { user: "someone" }))],
  ["POST /api/profile/epic", () => epicPost(profileSyncRequest("epic", { user: "someone" }))],
];

function spendAnonymousBudget() {
  const key = extractClientKey(new Request("http://localhost/"), ANONYMOUS_RATE_LIMIT_SCOPE);
  for (let i = 0; i < ANONYMOUS_RATE_LIMIT.maxRequests; i++) checkRateLimit(key, ANONYMOUS_RATE_LIMIT);
}

describe("public routes rate-limit anonymous callers", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setDbForTesting(initDatabase(":memory:"));
    mockCookieStore.clear();
    resetRateLimiterForTesting();
  });

  it.each(publicRoutes)("%s answers 429 without calling a third party once the budget is spent", async (_label, call) => {
    spendAnonymousBudget();
    const fetchSpy = vi.spyOn(global, "fetch");

    const res = await call();

    expect(res.status).toBe(429);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("keeps serving a signed-in user past the anonymous budget", async () => {
    const user = createUser("owner", "password123");
    mockCookieStore.set("trophyhunter_session", { name: "trophyhunter_session", value: createSession(user.id) });
    spendAnonymousBudget();
    vi.spyOn(global, "fetch").mockImplementation(async () => jsonResponse({ items: [] }));

    const res = await searchGet(new Request("http://localhost/api/search?q=portal"));

    expect(res.status).toBe(200);
  });
});
