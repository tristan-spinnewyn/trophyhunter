// @vitest-environment jsdom
// __tests__/components/library/useRecentPlaySessions.test.ts
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useRecentPlaySessions } from "@/components/library/hooks/useRecentPlaySessions";

describe("useRecentPlaySessions", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not ask for sessions when signed out", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useRecentPlaySessions(false, { days: 7, now: new Date("2026-11-11T12:00:00.000Z") }));

    expect(result.current).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("loads the sessions of the asked number of days", async () => {
    const sessions = [{ appId: 1, platform: "steam", name: "Hades", minutes: 30, detectedAt: "2026-11-10T20:00:00.000Z" }];
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(new Response(JSON.stringify({ sessions })));

    const { result } = renderHook(() => useRecentPlaySessions(true, { days: 7, now: new Date("2026-11-11T12:00:00.000Z") }));

    await waitFor(() => expect(result.current).toEqual(sessions));
    expect(String(fetchSpy.mock.calls[0][0])).toBe("/api/user/sessions?since=2026-11-04T12%3A00%3A00.000Z");
  });

  it("falls back to no sessions when the request fails", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(new Response("", { status: 500 }));

    const { result } = renderHook(() => useRecentPlaySessions(true, { days: 90, now: new Date("2026-11-11T12:00:00.000Z") }));

    await waitFor(() => expect(result.current).toEqual([]));
  });
});
