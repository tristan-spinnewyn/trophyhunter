// __tests__/epic/enrichment.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { searchSteamMetadataForTitle } from "@/lib/epic/enrichment";
import { jsonResponse } from "../helpers/responses";

describe("searchSteamMetadataForTitle", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("prefers the exact title match and counts its achievements", async () => {
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(jsonResponse({
        items: [
          { id: 1, name: "Hades II", tiny_image: "https://cdn.steam/h2.jpg" },
          { id: 2, name: "Hades", tiny_image: "https://cdn.steam/h1.jpg" },
        ],
      }))
      .mockResolvedValueOnce(jsonResponse({ response: { achievements: [{ name: "A" }, { name: "B" }] } }));

    expect(await searchSteamMetadataForTitle("Hades")).toEqual({
      steamAppId: "2",
      tinyImage: "https://cdn.steam/h1.jpg",
      totalAchievements: 2,
    });
  });

  it("falls back to the first result and leaves the count unset without achievements", async () => {
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(jsonResponse({ items: [{ id: 7, name: "Something Else", tiny_image: "https://cdn.steam/x.jpg" }] }))
      .mockResolvedValueOnce(jsonResponse({ response: { achievements: [] } }));

    expect(await searchSteamMetadataForTitle("Unrelated Title")).toEqual({
      steamAppId: "7",
      tinyImage: "https://cdn.steam/x.jpg",
      totalAchievements: undefined,
    });
  });

  it("returns nothing when the store search has no result", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(jsonResponse({ total: 0, items: [] }));

    expect(await searchSteamMetadataForTitle("Nothing")).toEqual({});
  });
});
