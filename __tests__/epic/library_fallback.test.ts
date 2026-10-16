// __tests__/epic/library_fallback.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchEpicLibraryItems } from "@/lib/epic/library";
import { jsonResponse } from "../helpers/responses";

describe("Epic Library Fallback Strategies", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("falls back to entitlements API when library and assets are empty", async () => {
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(jsonResponse({ error: "not found" }, 404))
      .mockResolvedValueOnce(jsonResponse({ error: "not found" }, 404))
      .mockResolvedValueOnce(
        jsonResponse([
          {
            entitlementName: "AlanWake2",
            catalogItemId: "cat_aw2",
            namespace: "b30adba602494921b77cbff2f0a82ac0",
          },
        ])
      );

    const items = await fetchEpicLibraryItems("fake_token", "acc_123");
    expect(items).toHaveLength(1);
    expect(items[0].appName).toBe("AlanWake2");
    expect(items[0].namespace).toBe("b30adba602494921b77cbff2f0a82ac0");
  });
});
