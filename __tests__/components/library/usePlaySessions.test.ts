// @vitest-environment jsdom
// __tests__/components/library/usePlaySessions.test.ts
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { usePlaySessions } from "@/components/library/hooks/usePlaySessions";

describe("usePlaySessions", () => {
  afterEach(() => vi.restoreAllMocks());

  it("loads every session when no start date is given", async () => {
    const sessions = [{ appId: 1, platform: "steam", name: "Hades", minutes: 30, detectedAt: "2024-11-10T20:00:00.000Z" }];
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(new Response(JSON.stringify({ sessions })));

    const { result } = renderHook(() => usePlaySessions(true));

    await waitFor(() => expect(result.current).toEqual(sessions));
    expect(String(fetchSpy.mock.calls[0][0])).toBe("/api/user/sessions");
  });

  it("loads the sessions since a date", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(new Response(JSON.stringify({ sessions: [] })));

    renderHook(() => usePlaySessions(true, "2026-01-01T00:00:00.000Z"));

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    expect(String(fetchSpy.mock.calls[0][0])).toBe("/api/user/sessions?since=2026-01-01T00%3A00%3A00.000Z");
  });

  it("asks nothing when signed out", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => usePlaySessions(false));

    expect(result.current).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
