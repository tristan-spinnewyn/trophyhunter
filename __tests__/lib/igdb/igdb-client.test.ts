// __tests__/lib/igdb/igdb-client.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isIgdbConfigured, igdbQuery, resetIgdbTokenForTesting } from "@/lib/igdb/igdb-client";

const tokenResponse = (expiresIn = 5_000_000) =>
  new Response(JSON.stringify({ access_token: "token-1", expires_in: expiresIn, token_type: "bearer" }));

describe("igdb client", () => {
  beforeEach(() => {
    resetIgdbTokenForTesting();
    vi.stubEnv("IGDB_CLIENT_ID", "client-id");
    vi.stubEnv("IGDB_CLIENT_SECRET", "client-secret");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("is configured only when both Twitch keys are set", () => {
    expect(isIgdbConfigured()).toBe(true);

    vi.stubEnv("IGDB_CLIENT_SECRET", " ");
    expect(isIgdbConfigured()).toBe(false);
  });

  it("gets a Twitch app token, then queries IGDB with it", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: 1 }])));

    const rows = await igdbQuery("games", "fields id; limit 1;");

    expect(rows).toEqual([{ id: 1 }]);
    const [tokenUrl, tokenInit] = fetchMock.mock.calls[0];
    expect(String(tokenUrl)).toBe(
      "https://id.twitch.tv/oauth2/token?client_id=client-id&client_secret=client-secret&grant_type=client_credentials"
    );
    expect(tokenInit?.method).toBe("POST");
    const [queryUrl, queryInit] = fetchMock.mock.calls[1];
    expect(String(queryUrl)).toBe("https://api.igdb.com/v4/games");
    expect(queryInit).toEqual(
      expect.objectContaining({
        method: "POST",
        body: "fields id; limit 1;",
        headers: expect.objectContaining({ "Client-ID": "client-id", Authorization: "Bearer token-1" }),
      })
    );
  });

  it("reuses the token until shortly before it expires", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-11T00:00:00.000Z"));
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (url) =>
      String(url).startsWith("https://id.twitch.tv") ? tokenResponse(3600) : new Response("[]")
    );

    await igdbQuery("games", "fields id;");
    await igdbQuery("games", "fields id;");
    expect(fetchMock.mock.calls.filter(([u]) => String(u).includes("twitch")).length).toBe(1);

    vi.setSystemTime(new Date("2026-11-11T00:59:30.000Z"));
    await igdbQuery("games", "fields id;");
    expect(fetchMock.mock.calls.filter(([u]) => String(u).includes("twitch")).length).toBe(2);
  });

  it("fails clearly when IGDB refuses a query", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(new Response("Too Many Requests", { status: 429 }));

    await expect(igdbQuery("games", "fields id;")).rejects.toThrow("IGDB games query failed: 429");
  });

  it("does not call anything when the keys are missing", async () => {
    vi.stubEnv("IGDB_CLIENT_ID", "");
    const fetchMock = vi.spyOn(globalThis, "fetch");

    await expect(igdbQuery("games", "fields id;")).rejects.toThrow("IGDB is not configured");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
