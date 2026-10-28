// @vitest-environment jsdom
// __tests__/components/ui/useAutoDismiss.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useAutoDismiss } from "@/components/ui/useAutoDismiss";

describe("useAutoDismiss", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("dismisses after the delay while active", () => {
    const onDismiss = vi.fn();
    renderHook(() => useAutoDismiss(true, onDismiss, 5000));

    vi.advanceTimersByTime(4999);
    expect(onDismiss).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("never dismisses while inactive (errors stay until closed)", () => {
    const onDismiss = vi.fn();
    renderHook(() => useAutoDismiss(false, onDismiss, 5000));

    vi.advanceTimersByTime(60_000);
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("restarts the delay when a new message arrives", () => {
    const onDismiss = vi.fn();
    const { rerender } = renderHook(({ key }) => useAutoDismiss(true, onDismiss, 5000, key), {
      initialProps: { key: "first" },
    });

    vi.advanceTimersByTime(4000);
    rerender({ key: "second" });
    vi.advanceTimersByTime(4000);
    expect(onDismiss).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("cancels the timer on unmount", () => {
    const onDismiss = vi.fn();
    const { unmount } = renderHook(() => useAutoDismiss(true, onDismiss, 5000));

    unmount();
    vi.advanceTimersByTime(5000);
    expect(onDismiss).not.toHaveBeenCalled();
  });
});
