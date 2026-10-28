// @vitest-environment jsdom
// __tests__/components/navbar/useNavbarSearch.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { jsonResponse } from "../../helpers/responses";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const { useNavbarSearch } = await import("@/components/navbar/useNavbarSearch");

describe("useNavbarSearch", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    push.mockReset();
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  it("searches after a 300 ms pause, only from two characters", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ games: [{ id: 620, name: "Portal 2", img: "" }] }));
    const { result } = renderHook(() => useNavbarSearch({}));

    act(() => result.current.setQuery("p"));
    await act(() => vi.advanceTimersByTimeAsync(400));
    expect(fetchSpy).not.toHaveBeenCalled();

    act(() => result.current.setQuery("portal 2"));
    await act(() => vi.advanceTimersByTimeAsync(299));
    expect(fetchSpy).not.toHaveBeenCalled();
    await act(() => vi.advanceTimersByTimeAsync(1));

    expect(fetchSpy).toHaveBeenCalledWith("/api/search?q=portal%202");
    expect(result.current.results).toEqual([{ id: 620, name: "Portal 2", img: "" }]);
    expect(result.current.isLoading).toBe(false);
  });

  it("keeps previous results on a failed search", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { result } = renderHook(() => useNavbarSearch({}));
    act(() => result.current.setQuery("halo"));
    await act(() => vi.advanceTimersByTimeAsync(300));
    expect(result.current.results).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it("opens the picked game and resets the search", () => {
    const onSelectGame = vi.fn();
    const { result } = renderHook(() => useNavbarSearch({ onSelectGame }));
    act(() => { result.current.setQuery("portal"); result.current.setIsOpen(true); });

    act(() => result.current.handlePickGame(620));

    expect(onSelectGame).toHaveBeenCalledWith(620);
    expect(push).toHaveBeenCalledWith("/game/620");
    expect(result.current).toMatchObject({ query: "", isOpen: false });
  });

  it("closes the dropdown on a click outside", () => {
    const { result } = renderHook(() => useNavbarSearch({}));
    const inside = document.createElement("div");
    document.body.appendChild(inside);
    (result.current.searchRef as { current: HTMLDivElement | null }).current = inside;
    act(() => result.current.setIsOpen(true));

    act(() => { inside.dispatchEvent(new MouseEvent("mousedown", { bubbles: true })); });
    expect(result.current.isOpen).toBe(true);

    act(() => { document.body.dispatchEvent(new MouseEvent("mousedown", { bubbles: true })); });
    expect(result.current.isOpen).toBe(false);
  });
});
