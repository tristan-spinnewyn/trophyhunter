// __tests__/api/profile/server-keys.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST as steamPost } from "@/app/api/profile/steam/route";
import { POST as xboxPost } from "@/app/api/profile/xbox/route";
import { initDatabase, setDbForTesting, createUser, createSession, getUserPlatformApiKey } from "@/lib/db";
import type { CookieRecord } from "../../helpers/cookies";
import { profileSyncRequest } from "../../helpers/profileRequests";
import { requestUrl } from "../../helpers/networkGuard";
import { jsonResponse, textResponse } from "../../helpers/responses";

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

function calledUrls(fetchSpy: { mock: { calls: unknown[][] } }): string[] {
  return fetchSpy.mock.calls.map(([input]) => requestUrl(input as RequestInfo | URL));
}

describe("/api/profile/* server API keys", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setDbForTesting(initDatabase(":memory:"));
    mockCookieStore.clear();
    vi.stubEnv("STEAM_API_KEY", "server-steam-key");
    vi.stubEnv("OPENXBL_API_KEY", "server-xbox-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("does not spend the server Steam key on an anonymous caller", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockImplementation(async () => textResponse(""));

    await steamPost(profileSyncRequest("steam", { user: "76561198000000000" }));

    expect(calledUrls(fetchSpy).some((url) => url.includes("server-steam-key"))).toBe(false);
  });

  it("does not spend the server Xbox key on an anonymous caller", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const res = await xboxPost(profileSyncRequest("xbox", { user: "MajorNelson" }));

    expect(fetchSpy).not.toHaveBeenCalled();
    const data = await res.json();
    expect(data.discoveredGames).toEqual([]);
    expect(data.notice).toContain("OpenXBL");
  });

  it("does not copy the server Xbox key into the signed-in user's account", async () => {
    const user = createUser("XboxOwner", "password123");
    mockCookieStore.set("trophyhunter_session", { name: "trophyhunter_session", value: createSession(user.id) });
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(jsonResponse({ profileUsers: [{ id: "2533274812345678", settings: [{ id: "Gamertag", value: "Owner" }] }] }))
      .mockImplementation(async () => jsonResponse({ titles: [] }));

    const res = await xboxPost(profileSyncRequest("xbox", { user: "2533274812345678" }));

    expect(res.status).toBe(200);
    expect(getUserPlatformApiKey(user.id, "xbox")).toBeNull();
  });
});
