// @vitest-environment jsdom
// __tests__/components/ui/FeedbackToasts.test.tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import FeedbackToasts from "@/components/ui/FeedbackToasts";

describe("FeedbackToasts", () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("renders nothing without feedback", () => {
    const { container } = render(<FeedbackToasts bannerMsg={null} onDismissBanner={vi.fn()} syncProgressText={null} />);

    expect(container.innerHTML).toBe("");
  });

  it("shows the sync progress", () => {
    render(<FeedbackToasts bannerMsg={null} onDismissBanner={vi.fn()} syncProgressText="Import de 12 jeux…" />);

    expect(screen.getByRole("status").textContent).toBe("Import de 12 jeux…");
  });

  it("keeps an error until the user closes it", () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    render(<FeedbackToasts bannerMsg={{ type: "error", text: "Échec" }} onDismissBanner={onDismiss} syncProgressText={null} />);

    act(() => vi.advanceTimersByTime(10_000));
    expect(onDismiss).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Fermer" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("alert").textContent).toContain("Échec");
  });

  it("dismisses a success message on its own", () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    render(<FeedbackToasts bannerMsg={{ type: "success", text: "Synchronisé" }} onDismissBanner={onDismiss} syncProgressText={null} />);

    expect(screen.getByRole("status").textContent).toContain("Synchronisé");
    act(() => vi.advanceTimersByTime(5000));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
