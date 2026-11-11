// @vitest-environment jsdom
// __tests__/components/goals/useYearGoals.test.ts
import { describe, it, expect, vi, afterEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useYearGoals } from "@/components/goals/useYearGoals";

afterEach(() => vi.restoreAllMocks());

const goal = { year: 2027, kind: "games-finished", target: 12, baseline: null, current: 5, ratio: 5 / 12, isReached: false, pace: "behind" };
const answer = (goals: unknown[], status = 200) => new Response(JSON.stringify(goals ? { goals } : {}), { status });

describe("useYearGoals", () => {
  it("loads the goals of the year for a signed-in user", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(answer([goal]));

    const { result } = renderHook(() => useYearGoals(2027, true));

    await waitFor(() => expect(result.current.goals).toEqual([goal]));
    expect(fetchMock).toHaveBeenCalledWith("/api/user/goals?year=2027");
  });

  it("sets and removes a goal, taking the server's answer", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(answer([]));
    const { result } = renderHook(() => useYearGoals(2027, true));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    fetchMock.mockResolvedValueOnce(answer([goal]));
    await act(() => result.current.setGoal("games-finished", 12));
    expect(fetchMock).toHaveBeenLastCalledWith("/api/user/goals", expect.objectContaining({
      method: "PUT",
      body: JSON.stringify({ year: 2027, kind: "games-finished", target: 12 }),
    }));
    expect(result.current.goals).toEqual([goal]);

    fetchMock.mockResolvedValueOnce(answer([]));
    await act(() => result.current.removeGoal("games-finished"));
    expect(fetchMock).toHaveBeenLastCalledWith("/api/user/goals", expect.objectContaining({
      method: "DELETE",
      body: JSON.stringify({ year: 2027, kind: "games-finished" }),
    }));
    expect(result.current.goals).toEqual([]);
  });

  it("explains a change the server refused and keeps the goals", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(answer([goal]));
    const { result } = renderHook(() => useYearGoals(2027, true));
    await waitFor(() => expect(result.current.goals).toEqual([goal]));

    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ error: "Objectif invalide." }), { status: 400 }));
    await act(() => result.current.setGoal("games-finished", 0));

    expect(result.current.error).toBe("Objectif invalide.");
    expect(result.current.goals).toEqual([goal]);
  });

  it("asks nothing for a visitor", () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");

    const { result } = renderHook(() => useYearGoals(2027, false));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.goals).toEqual([]);
  });

  it("shows no goal when the server cannot answer", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));

    const { result } = renderHook(() => useYearGoals(2027, true));

    await waitFor(() => expect(result.current.goals).toEqual([]));
  });
});
