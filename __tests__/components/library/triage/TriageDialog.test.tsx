// @vitest-environment jsdom
// __tests__/components/library/triage/TriageDialog.test.tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { TriageDialog } from "@/components/library/triage/TriageDialog";
import { makeOwnedGame } from "../../../helpers/gameFixtures";
import type { OwnedGame } from "@/lib/types";

afterEach(cleanup);

const NOW = new Date("2026-11-10T12:00:00.000Z");

const hades = makeOwnedGame({ appId: 1, name: "Hades", unlockedCount: 0, playtimeHours: 0 });
const celeste = makeOwnedGame({ appId: 2, name: "Celeste", platform: "gog", playtimeHours: 14, lastPlayed: "2025-01-01T00:00:00.000Z" });
const portal = makeOwnedGame({ appId: 3, name: "Portal", totalAchievements: 5, unlockedCount: 5 });

function renderTriage(games: OwnedGame[] = [hades, celeste, portal]) {
  const onSetStatus = vi.fn();
  const onClose = vi.fn();
  const view = render(<TriageDialog games={games} onSetStatus={onSetStatus} onClose={onClose} now={NOW} />);
  return { onSetStatus, onClose, ...view };
}

const dialog = () => screen.getByRole("dialog", { name: "Trier mes jeux" });
const currentGame = () => within(dialog()).getByRole("heading", { level: 3 }).textContent;

describe("TriageDialog", () => {
  it("presents one unsorted game at a time with where it stands in the pile", () => {
    renderTriage();

    expect(currentGame()).toBe("Hades");
    expect(within(dialog()).getByText("1 / 3")).toBeTruthy();
    expect(within(dialog()).getByText("Steam")).toBeTruthy();
  });

  it("offers every destination except unsorted", () => {
    renderTriage();

    const destinations = within(screen.getByRole("group", { name: "Ranger ce jeu" })).getAllByRole("button");
    expect(destinations.map((b) => b.getAttribute("data-status"))).toEqual([
      "backlog",
      "in-progress",
      "paused",
      "completed",
      "abandoned",
    ]);
  });

  it("sets the chosen status and moves on to the next game", () => {
    const { onSetStatus } = renderTriage();

    fireEvent.click(screen.getByRole("button", { name: /^Abandonné/ }));

    expect(onSetStatus).toHaveBeenCalledWith(1, "steam", "abandoned");
    expect(currentGame()).toBe("Celeste");
    expect(within(dialog()).getByText("2 / 3")).toBeTruthy();
  });

  it("skips a game without changing its status", () => {
    const { onSetStatus } = renderTriage();

    fireEvent.click(screen.getByRole("button", { name: /^Passer/ }));

    expect(onSetStatus).not.toHaveBeenCalled();
    expect(currentGame()).toBe("Celeste");
  });

  it("shows the suggestion with its reason and applies it with Enter", () => {
    const { onSetStatus } = renderTriage();

    expect(within(dialog()).getByText(/Jamais lancé/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /^Backlog/ }).getAttribute("data-suggested")).toBe("true");

    fireEvent.keyDown(document, { key: "Enter" });

    expect(onSetStatus).toHaveBeenCalledWith(1, "steam", "backlog");
  });

  it("puts the focus on the suggestion of each new game, so Enter never reuses the previous choice", () => {
    renderTriage([hades, portal, celeste]);
    expect(document.activeElement?.getAttribute("data-status")).toBe("backlog");

    fireEvent.click(screen.getByRole("button", { name: /^Abandonné/ }));
    expect(currentGame()).toBe("Portal");
    expect(document.activeElement?.getAttribute("data-status")).toBe("completed");
  });

  it("puts the focus on skip when there is no suggestion", () => {
    renderTriage([celeste]);
    expect(document.activeElement?.textContent).toMatch(/^Passer/);
  });

  it("does nothing on Enter when there is no suggestion", () => {
    const { onSetStatus } = renderTriage([celeste]);

    expect(within(dialog()).queryByText(/Suggestion/)).toBeNull();
    fireEvent.keyDown(document, { key: "Enter" });

    expect(onSetStatus).not.toHaveBeenCalled();
    expect(currentGame()).toBe("Celeste");
  });

  it("sorts from the keyboard: one letter per destination, S to skip", () => {
    const { onSetStatus } = renderTriage();

    fireEvent.keyDown(document, { key: "s" });
    fireEvent.keyDown(document, { key: "P" });
    fireEvent.keyDown(document, { key: "t" });

    expect(onSetStatus.mock.calls).toEqual([
      [2, "gog", "paused"],
      [3, "steam", "completed"],
    ]);
  });

  it("ignores shortcuts combined with a modifier key, so browser shortcuts keep working", () => {
    const { onSetStatus } = renderTriage();

    fireEvent.keyDown(document, { key: "t", ctrlKey: true });

    expect(onSetStatus).not.toHaveBeenCalled();
    expect(currentGame()).toBe("Hades");
  });

  it("keeps its pile while sorted games leave the unsorted shelf behind it", () => {
    const { rerender, onSetStatus, onClose } = renderTriage();

    fireEvent.click(screen.getByRole("button", { name: /^Backlog/ }));
    rerender(<TriageDialog games={[celeste, portal]} onSetStatus={onSetStatus} onClose={onClose} now={NOW} />);

    expect(currentGame()).toBe("Celeste");
    expect(within(dialog()).getByText("2 / 3")).toBeTruthy();
  });

  it("sums up the session at the end of the pile and closes", () => {
    const { onClose } = renderTriage();

    fireEvent.keyDown(document, { key: "b" });
    fireEvent.keyDown(document, { key: "s" });
    fireEvent.keyDown(document, { key: "t" });

    expect(within(dialog()).getByText("2 jeux triés, 1 passé.")).toBeTruthy();
    fireEvent.keyDown(document, { key: "t" });
    fireEvent.click(screen.getByRole("button", { name: "Terminer" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes with Escape, leaving the rest of the pile unsorted", () => {
    const { onClose, onSetStatus } = renderTriage();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).toHaveBeenCalled();
    expect(onSetStatus).not.toHaveBeenCalled();
  });
});
