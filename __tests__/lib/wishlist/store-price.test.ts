// __tests__/lib/wishlist/store-price.test.ts
import { describe, it, expect, vi, afterEach } from "vitest";
import { PRICED_PLATFORMS, fetchStorePrice, formatPrice, hasReachedTarget, parseGogPrice, parseSteamPrice } from "@/lib/wishlist/store-price";

describe("parseSteamPrice", () => {
  it("reads the final price of a game in cents", () => {
    const json = { "620": { success: true, data: { price_overview: { currency: "EUR", initial: 1999, final: 499, discount_percent: 75 } } } };

    expect(parseSteamPrice(json, 620)).toEqual({ cents: 499, currency: "EUR" });
  });

  it("gives null for a free game, an unknown game or an odd answer", () => {
    expect(parseSteamPrice({ "570": { success: true, data: [] } }, 570)).toBeNull();
    expect(parseSteamPrice({ "1": { success: false } }, 1)).toBeNull();
    expect(parseSteamPrice(null, 1)).toBeNull();
  });
});

describe("parseGogPrice", () => {
  it("reads the final price of the first listed currency", () => {
    const json = { _embedded: { prices: [{ currency: { code: "EUR" }, basePrice: "2999 EUR", finalPrice: "1499 EUR" }] } };

    expect(parseGogPrice(json)).toEqual({ cents: 1499, currency: "EUR" });
  });

  it("gives null for an odd answer", () => {
    expect(parseGogPrice({ _embedded: { prices: [] } })).toBeNull();
    expect(parseGogPrice({ _embedded: { prices: [{ currency: { code: "EUR" }, finalPrice: "free" }] } })).toBeNull();
    expect(parseGogPrice("nope")).toBeNull();
  });
});

describe("fetchStorePrice", () => {
  afterEach(() => vi.restoreAllMocks());

  it("asks the Steam store in euros for a Steam game", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ "620": { success: true, data: { price_overview: { currency: "EUR", final: 999 } } } }))
    );

    expect(await fetchStorePrice("steam", 620)).toEqual({ cents: 999, currency: "EUR" });
    expect(String(fetchSpy.mock.calls[0][0])).toBe("https://store.steampowered.com/api/appdetails?appids=620&cc=fr&filters=price_overview");
  });

  it("asks GOG for a GOG game", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ _embedded: { prices: [{ currency: { code: "EUR" }, finalPrice: "799 EUR" }] } }))
    );

    expect(await fetchStorePrice("gog", 1207658924)).toEqual({ cents: 799, currency: "EUR" });
    expect(String(fetchSpy.mock.calls[0][0])).toBe("https://api.gog.com/products/1207658924/prices?countryCode=FR");
  });

  it("has no price for other platforms or when the store fails", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(new Response("", { status: 503 }));

    expect(await fetchStorePrice("xbox", 1)).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(await fetchStorePrice("steam", 1)).toBeNull();
  });
});

describe("hasReachedTarget", () => {
  it("is true once the last price is at or under the target", () => {
    expect(hasReachedTarget({ lastPriceCents: 999, targetPriceCents: 1000 })).toBe(true);
    expect(hasReachedTarget({ lastPriceCents: 1000, targetPriceCents: 1000 })).toBe(true);
    expect(hasReachedTarget({ lastPriceCents: 1500, targetPriceCents: 1000 })).toBe(false);
    expect(hasReachedTarget({ lastPriceCents: undefined, targetPriceCents: 1000 })).toBe(false);
    expect(hasReachedTarget({ lastPriceCents: 500, targetPriceCents: undefined })).toBe(false);
  });
});

describe("formatPrice", () => {
  it("formats cents in the currency, the French way", () => {
    expect(formatPrice(1499, "EUR").replace(/\s/g, " ")).toBe("14,99 €");
  });
});

describe("PRICED_PLATFORMS", () => {
  it("lists the stores whose prices are read", () => {
    expect(PRICED_PLATFORMS).toEqual(["steam", "gog"]);
  });
});
