// __tests__/api/general/gamepass_pc.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/gamepass/pc/route";
import * as catalogService from "@/lib/gamepass/catalog.services";
import { GamePassCatalogError } from "@/lib/gamepass/gamepass.types";

describe("GET /api/gamepass/pc", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns games list and total count on success", async () => {
    const spy = vi.spyOn(catalogService, "fetchPcGamePassCatalog").mockResolvedValue({
      games: [
        {
          storeId: "9NPDN9R45JX4",
          appId: 1615431074,
          name: "1000xRESIST",
          headerImg: "https://img",
          developer: "Dev",
          publisher: "Pub",
          category: "RPG",
          shortDescription: "Desc",
          hasXboxAchievements: true,
          isPlayAnywhere: true,
        },
      ],
      fetchedAt: "2026-10-18T12:00:00.000Z",
    });

    const req = new Request("http://localhost:3000/api/gamepass/pc?refresh=1");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(spy).toHaveBeenCalledWith({ forceRefresh: true });
    expect(body.total).toBe(1);
    expect(body.games[0].name).toBe("1000xRESIST");
  });

  it("returns typed status code when GamePassCatalogError is thrown", async () => {
    vi.spyOn(catalogService, "fetchPcGamePassCatalog").mockRejectedValue(
      new GamePassCatalogError("Service Microsoft indisponible", 503)
    );

    const req = new Request("http://localhost:3000/api/gamepass/pc");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.error).toBe("Service Microsoft indisponible");
  });

  it("returns 500 on unexpected error", async () => {
    vi.spyOn(catalogService, "fetchPcGamePassCatalog").mockRejectedValue(
      new Error("Network failure")
    );

    const req = new Request("http://localhost:3000/api/gamepass/pc");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).not.toHaveProperty("details");
    expect(JSON.stringify(body)).not.toContain("Network failure");
  });
});
