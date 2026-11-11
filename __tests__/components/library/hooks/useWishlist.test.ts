// @vitest-environment jsdom
// __tests__/components/library/hooks/useWishlist.test.ts
import { describe, it, expect, vi, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useWishlist } from "@/components/library/hooks/useWishlist";

afterEach(() => vi.restoreAllMocks());

// The hook re-reads `initialWishlist` whenever it changes, so it must be a stable list.
const NO_WISHLIST: number[] = [];

describe("useWishlist", () => {
  it("sends the name and cover of a wished-for game, so a game not owned yet can be shown", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}"));
    const { result } = renderHook(() =>
      useWishlist({ currentUser: { id: "u1", username: "me" } as never, initialWishlist: NO_WISHLIST, setBannerMsg: vi.fn() })
    );

    await act(() => result.current.handleToggleWishlist(900, "xbox", { name: "Starfield", headerImg: "https://example.com/sf.jpg" }));

    expect(result.current.wishlistIds).toEqual([900]);
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      appId: 900,
      platform: "xbox",
      isWishlist: true,
      name: "Starfield",
      headerImg: "https://example.com/sf.jpg",
    });
  });
});
