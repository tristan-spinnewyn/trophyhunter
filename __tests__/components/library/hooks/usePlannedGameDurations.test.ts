// @vitest-environment jsdom
// __tests__/components/library/hooks/usePlannedGameDurations.test.ts
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { usePlannedGameDurations } from "@/components/library/hooks/usePlannedGameDurations";
import { makeOwnedGame } from "../../../helpers/gameFixtures";

afterEach(() => vi.restoreAllMocks());

const portalDurations = { hastilySeconds: 28800, normallySeconds: 36000, completelySeconds: null };
const backlog = [makeOwnedGame({ appId: 620, status: "backlog" }), makeOwnedGame({ appId: 400, status: "completed" })];

describe("usePlannedGameDurations", () => {
  it("loads the durations of the backlog for a signed-in user", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ durations: { steam_620: portalDurations } })));

    const { result } = renderHook(() => usePlannedGameDurations(backlog, true));

    await waitFor(() => expect(result.current).toEqual({ steam_620: portalDurations }));
    expect(fetchMock).toHaveBeenCalledWith("/api/user/time-to-beat");
  });

  it("asks again when a game joins the games ahead, not when a finished game changes", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async () => new Response(JSON.stringify({ durations: {} })));
    const { rerender } = renderHook(({ games }) => usePlannedGameDurations(games, true), { initialProps: { games: backlog } });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    rerender({ games: [...backlog, makeOwnedGame({ appId: 1, status: "completed" })] });
    rerender({ games: [...backlog, makeOwnedGame({ appId: 2, status: "in-progress" })] });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });

  it("asks nothing for a visitor or an empty backlog", () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");

    renderHook(() => usePlannedGameDurations(backlog, false));
    renderHook(() => usePlannedGameDurations([backlog[1]], true));

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows no duration when the server cannot answer", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));

    const { result } = renderHook(() => usePlannedGameDurations(backlog, true));

    await waitFor(() => expect(result.current).toEqual({}));
  });
});
