// @vitest-environment jsdom
// __tests__/components/ui/useCloseOnEscape.test.ts
import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useCloseOnEscape } from "@/components/ui/useCloseOnEscape";

const press = (key: string) => document.dispatchEvent(new KeyboardEvent("keydown", { key }));

describe("useCloseOnEscape", () => {
  it("calls onClose when Escape is pressed while active", () => {
    const onClose = vi.fn();
    renderHook(() => useCloseOnEscape(true, onClose));

    press("Escape");

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("ignores other keys", () => {
    const onClose = vi.fn();
    renderHook(() => useCloseOnEscape(true, onClose));

    press("Enter");

    expect(onClose).not.toHaveBeenCalled();
  });

  it("does nothing while inactive", () => {
    const onClose = vi.fn();
    renderHook(() => useCloseOnEscape(false, onClose));

    press("Escape");

    expect(onClose).not.toHaveBeenCalled();
  });

  it("stops listening once unmounted", () => {
    const onClose = vi.fn();
    const { unmount } = renderHook(() => useCloseOnEscape(true, onClose));
    unmount();

    press("Escape");

    expect(onClose).not.toHaveBeenCalled();
  });
});
