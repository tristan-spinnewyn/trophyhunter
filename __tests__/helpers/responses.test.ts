// __tests__/helpers/responses.test.ts
import { describe, it, expect } from "vitest";
import { emptyThirdPartyResponse } from "./responses";
import { networkGuard } from "./networkGuard";

describe("emptyThirdPartyResponse", () => {
  it.each([
    "https://launcher.store.epicgames.com/graphql",
    "https://graphql.epicgames.com/graphql",
  ])("answers Epic GraphQL (%s) with an empty data object", async (url) => {
    const res = await emptyThirdPartyResponse(url);
    expect(await res.json()).toEqual({ data: {} });
  });

  it("answers a Steam store search with no match", async () => {
    const res = await emptyThirdPartyResponse(
      new Request("https://store.steampowered.com/api/storesearch/?term=Hades&l=french&cc=fr")
    );
    expect(await res.json()).toEqual({ total: 0, items: [] });
  });

  it("leaves any other URL to the network guard", async () => {
    await expect(emptyThirdPartyResponse("https://api.example.com/other")).rejects.toThrow(
      "Real network call blocked in tests"
    );
    expect(networkGuard.takeBlockedUrls()).toEqual(["https://api.example.com/other"]);
  });
});
