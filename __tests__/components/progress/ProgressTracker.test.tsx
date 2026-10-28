// @vitest-environment jsdom
// __tests__/components/progress/ProgressTracker.test.tsx
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ProgressTrackerProps } from "@/components/progress/ProgressTracker.types";
import { ConfirmProvider } from "@/components/ui/confirm/ConfirmProvider";

const confetti = vi.fn();
vi.mock("canvas-confetti", () => ({ default: confetti }));

const { default: ProgressTracker } = await import("@/components/progress/ProgressTracker");

function tracker(overrides: Partial<ProgressTrackerProps> = {}) {
  const props: ProgressTrackerProps = { total: 10, unlockedCount: 4, onReset: vi.fn(), ...overrides };
  return { props, element: <ConfirmProvider><ProgressTracker {...props} /></ConfirmProvider> };
}

function renderTracker(overrides: Partial<ProgressTrackerProps> = {}) {
  const { props, element } = tracker(overrides);
  const view = render(element);
  return { props, ...view };
}

describe("ProgressTracker", () => {
  beforeEach(() => confetti.mockClear());
  afterEach(cleanup);

  it("shows the completion percentage and the remaining achievements", () => {
    renderTracker();

    expect(screen.getByText("40%")).toBeTruthy();
    expect(screen.getByText("4 / 10")).toBeTruthy();
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("40");
    expect(screen.getByText("6 succès restants")).toBeTruthy();
    expect(screen.getByText("Objectif 100%")).toBeTruthy();
  });

  it("says when the game has no achievements", () => {
    renderTracker({ total: 0, unlockedCount: 0 });

    expect(screen.getByText("Aucun succès")).toBeTruthy();
    expect(screen.getByText(/Aucun succès répertorié/)).toBeTruthy();
    expect(screen.queryByRole("progressbar")).toBeNull();
  });

  it("celebrates once when the last achievement is unlocked", () => {
    const { rerender } = renderTracker({ unlockedCount: 9 });
    expect(confetti).not.toHaveBeenCalled();

    rerender(tracker({ unlockedCount: 10 }).element);

    expect(screen.getByText(/Platine débloqué/)).toBeTruthy();
    expect(confetti).toHaveBeenCalledTimes(1);
  });

  it("does not celebrate a game that was already complete", () => {
    renderTracker({ unlockedCount: 10 });

    expect(confetti).not.toHaveBeenCalled();
  });

  it("points to the platform count while the checklist is empty", () => {
    renderTracker({ unlockedCount: 0, importedUnlockedCount: 7 });

    expect(screen.getByText(/Ta plateforme indique 7 succès débloqués/)).toBeTruthy();
  });

  it("syncs a connected platform and shows the sync in progress", () => {
    const onSync = vi.fn();
    renderTracker({ onSync, platform: "xbox", platformConnected: true });
    fireEvent.click(screen.getByRole("button", { name: "Synchroniser" }));
    expect(onSync).toHaveBeenCalled();
    expect(screen.getByTitle("Synchroniser avec votre compte Xbox")).toBeTruthy();
    cleanup();

    renderTracker({ onSync, isSyncing: true, hasSteamUser: true });
    expect((screen.getByRole("button", { name: "Sync…" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("invites the user to link a platform that is not connected", () => {
    renderTracker({ onSync: vi.fn(), platform: "gog" });
    expect(screen.getByRole("button", { name: "Lier GOG" })).toBeTruthy();
    cleanup();

    renderTracker({ onSync: vi.fn() });
    expect(screen.getByRole("button", { name: "Lier Steam" })).toBeTruthy();
  });

  it("treats Epic as connected and opens the Epic code modal", () => {
    const onOpenEpicModal = vi.fn();
    renderTracker({ onSync: vi.fn(), platform: "epic", onOpenEpicModal });

    expect(screen.getByRole("button", { name: "Synchroniser" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Code Epic" }));
    expect(onOpenEpicModal).toHaveBeenCalled();
  });

  it("resets the checklist only after confirmation", async () => {
    const { props } = renderTracker();

    fireEvent.click(screen.getByRole("button", { name: "Réinitialiser la checklist" }));
    fireEvent.click(await screen.findByRole("button", { name: "Réinitialiser" }));

    await vi.waitFor(() => expect(props.onReset).toHaveBeenCalled());
  });

  it("keeps the checklist when the reset is cancelled", async () => {
    const { props } = renderTracker();

    fireEvent.click(screen.getByRole("button", { name: "Réinitialiser la checklist" }));
    fireEvent.click(await screen.findByRole("button", { name: "Annuler" }));

    await vi.waitFor(() => expect(screen.queryByText("Réinitialiser la checklist ?")).toBeNull());
    expect(props.onReset).not.toHaveBeenCalled();
  });

  it("hides the reset button while nothing is checked", () => {
    renderTracker({ unlockedCount: 0 });

    expect(screen.queryByRole("button", { name: "Réinitialiser la checklist" })).toBeNull();
  });
});
