// @vitest-environment jsdom
// __tests__/components/library/useAddGameFlow.test.ts
import { describe, it, expect, vi, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useAddGameFlow } from "@/components/library/hooks/useAddGameFlow";

function renderFlow() {
  const props = {
    ownedGames: [],
    onOwnedGamesChange: vi.fn(),
    syncSingleSteamGame: vi.fn(),
    persistGames: vi.fn().mockResolvedValue(undefined),
    setBannerMsg: vi.fn(),
  };
  return { props, ...renderHook(() => useAddGameFlow(props)) };
}

describe("useAddGameFlow", () => {
  afterEach(() => vi.restoreAllMocks());

  it("adds a game on a platform tracked by hand without asking a store for its achievements", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");
    const { result, props } = renderFlow();

    act(() => result.current.setSelectedPlatformForAdd("switch"));
    await act(() => result.current.handleAddGameToLibrary({ id: 1_912_345_678, name: "Mario Kart 8", img: "" }));

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(props.persistGames).toHaveBeenCalledWith([
      expect.objectContaining({ appId: 1_912_345_678, name: "Mario Kart 8", platform: "switch", totalAchievements: 0, source: "manual" }),
    ]);
    expect(props.setBannerMsg).toHaveBeenCalledWith({ type: "success", text: '"Mario Kart 8" (Switch) ajouté à votre bibliothèque !' });
  });

  it("counts the achievements of a game added on a connected platform", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(new Response(JSON.stringify({ totalAchievements: 42 })));
    const { result, props } = renderFlow();

    act(() => result.current.setSelectedPlatformForAdd("gog"));
    await act(() => result.current.handleAddGameToLibrary({ id: 620, name: "Portal 2", img: "" }));

    expect(props.persistGames).toHaveBeenCalledWith([expect.objectContaining({ platform: "gog", totalAchievements: 42 })]);
  });
});
