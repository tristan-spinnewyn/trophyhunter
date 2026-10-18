// __tests__/lib/gamepass/catalog.services.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  chunkArray,
  clearGamePassCatalogCache,
  fetchPcGamePassCatalog,
} from "@/lib/gamepass/catalog.services";
import { GamePassCatalogError } from "@/lib/gamepass/gamepass.types";
import { jsonResponse } from "../../helpers/responses";

describe("lib/gamepass/catalog.services", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    clearGamePassCatalogCache();
  });

  it("chunkArray splits arrays accurately and handles non-positive chunk sizes", () => {
    expect(chunkArray([1, 2, 3], 0)).toEqual([]);
    expect(chunkArray([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("fetches, deduplicates, sorts and caches PC Game Pass catalog", async () => {
    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(
        jsonResponse([{ siglId: "header" }, { id: "ID_B" }, { id: "ID_A" }])
      )
      .mockResolvedValueOnce(
        jsonResponse({
          Products: [
            { ProductId: "ID_B", LocalizedProperties: [{ ProductTitle: "Zelda-like" }] },
            { ProductId: "ID_A", LocalizedProperties: [{ ProductTitle: "Age of Empires IV" }] },
          ],
        })
      );

    const first = await fetchPcGamePassCatalog();
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(first.games.map((g) => g.name)).toEqual(["Age of Empires IV", "Zelda-like"]);

    const cached = await fetchPcGamePassCatalog();
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(cached.games).toEqual(first.games);
  });

  it("returns empty array when SIGL payload contains no product IDs", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(jsonResponse([{ siglId: "only-header" }]));
    const res = await fetchPcGamePassCatalog({ forceRefresh: true });
    expect(res.games).toEqual([]);
  });

  it("throws GamePassCatalogError when SIGL or DisplayCatalog endpoint fails", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(jsonResponse({ error: "Down" }, 503));
    await expect(fetchPcGamePassCatalog({ forceRefresh: true })).rejects.toThrow(
      GamePassCatalogError
    );

    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(jsonResponse([{ id: "ID_1" }]))
      .mockResolvedValueOnce(jsonResponse({ error: "Bad gateway" }, 502));
    await expect(fetchPcGamePassCatalog({ forceRefresh: true })).rejects.toThrow(
      GamePassCatalogError
    );
  });
});
