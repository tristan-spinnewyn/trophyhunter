// @vitest-environment jsdom
// __tests__/components/series/useGameSeries.test.ts
import { describe, it, expect, vi, afterEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useGameSeries } from "@/components/series/useGameSeries";

afterEach(() => vi.restoreAllMocks());

const series = { name: "Portal", members: [], total: 2, ownedCount: 1, finishedCount: 1 };
const game = { platform: "steam" as const, appId: 620 };

describe("useGameSeries", () => {
  it("loads the series of an owned game for a signed-in user", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ series })));

    const { result } = renderHook(() => useGameSeries(game, true, vi.fn()));

    await waitFor(() => expect(result.current.series).toEqual(series));
    expect(fetchMock).toHaveBeenCalledWith("/api/user/game-series?platform=steam&appId=620");
  });

  it("asks nothing for a visitor or a game outside the collection", () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");

    renderHook(() => useGameSeries(game, false, vi.fn()));
    renderHook(() => useGameSeries(undefined, true, vi.fn()));

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows no series when the server cannot answer", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));

    const { result } = renderHook(() => useGameSeries(game, true, vi.fn()));

    await waitFor(() => expect(result.current.series).toBeNull());
  });

  it("wishes for a missing game through its Steam id and adds it to the wishlist in memory", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ series: null })));
    const onWished = vi.fn();
    const { result } = renderHook(() => useGameSeries(game, true, onWished));

    await act(() => result.current.wishFor({ igdbGameId: 3, name: "Portal 3", steamAppId: 999 }));

    expect(fetchMock).toHaveBeenLastCalledWith("/api/user/wishlist", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ appId: 999, platform: "steam", isWishlist: true, name: "Portal 3" }),
    }));
    expect(onWished).toHaveBeenCalledWith(999);
  });

  it("wishes for nothing without a Steam id, or when the save fails", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ series: null })));
    const onWished = vi.fn();
    const { result } = renderHook(() => useGameSeries(game, true, onWished));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    await act(() => result.current.wishFor({ igdbGameId: 3, name: "Portal 3" }));
    fetchMock.mockResolvedValueOnce(new Response("{}", { status: 500 }));
    await act(() => result.current.wishFor({ igdbGameId: 3, name: "Portal 3", steamAppId: 999 }));

    expect(onWished).not.toHaveBeenCalled();
  });
});
