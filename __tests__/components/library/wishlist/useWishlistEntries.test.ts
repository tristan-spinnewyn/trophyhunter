// @vitest-environment jsdom
// __tests__/components/library/wishlist/useWishlistEntries.test.ts
import { describe, it, expect, vi, afterEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useWishlistEntries } from "@/components/library/wishlist/useWishlistEntries";

const entries = [{ appId: 620, platform: "steam", name: "Portal 2", headerImg: "", addedAt: "2026-11-01" }];

describe("useWishlistEntries", () => {
  afterEach(() => vi.restoreAllMocks());

  it("loads the wishlist and saves a target price", async () => {
    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ wishlist: entries })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true })));
    const { result } = renderHook(() => useWishlistEntries("620"));
    await waitFor(() => expect(result.current.entries).toHaveLength(1));

    await act(() => result.current.saveTargetPrice(620, 999));

    expect(result.current.entries[0].targetPriceCents).toBe(999);
    expect(fetchSpy.mock.calls[1]).toEqual([
      "/api/user/wishlist/target",
      expect.objectContaining({ method: "PUT", body: JSON.stringify({ appId: 620, targetPriceCents: 999 }) }),
    ]);
  });

  it("keeps the previous target when saving fails, and survives a failed load", async () => {
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ wishlist: [{ ...entries[0], targetPriceCents: 500 }] })))
      .mockResolvedValueOnce(new Response("", { status: 500 }));
    const { result } = renderHook(() => useWishlistEntries("620"));
    await waitFor(() => expect(result.current.entries).toHaveLength(1));

    await act(() => result.current.saveTargetPrice(620, null));

    expect(result.current.entries[0].targetPriceCents).toBe(500);
  });

  it("is empty when the wishlist cannot be loaded", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("offline"));
    const { result } = renderHook(() => useWishlistEntries(""));

    await waitFor(() => expect(result.current.entries).toEqual([]));
  });
});
