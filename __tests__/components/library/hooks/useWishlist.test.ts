// @vitest-environment jsdom
// __tests__/components/library/hooks/useWishlist.test.ts
import { describe, it, expect, vi, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useWishlist } from "@/components/library/hooks/useWishlist";

afterEach(() => vi.restoreAllMocks());

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

  it("keeps a toggled game when no initial wishlist is given, instead of rendering forever", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}"));
    let renders = 0;
    const { result } = renderHook(() => {
      renders += 1;
      // A render loop would never end on its own: break out of it, so the test fails instead of hanging.
      if (renders > 20) throw new Error("useWishlist keeps rendering");
      return useWishlist({ currentUser: { id: "u1", username: "me" } as never, setBannerMsg: vi.fn() });
    });

    await act(() => result.current.handleToggleWishlist(5, "steam"));

    expect(result.current.wishlistIds).toEqual([5]);
    expect(renders).toBeLessThan(5);
  });

  it("follows a new initial wishlist", () => {
    const { result, rerender } = renderHook(({ initial }) => useWishlist({ initialWishlist: initial, setBannerMsg: vi.fn() }), {
      initialProps: { initial: [1] },
    });

    rerender({ initial: [1, 2] });

    expect(result.current.wishlistIds).toEqual([1, 2]);
  });
});
