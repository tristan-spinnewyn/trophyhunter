// @vitest-environment jsdom
// __tests__/components/library/shelf/SortableBacklogSpines.test.tsx
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { SortableBacklogSpines } from "@/components/library/shelf/SortableBacklogSpines";
import { makeOwnedGame } from "../../../helpers/gameFixtures";
import type { OwnedGame } from "@/lib/types";

const shelf: OwnedGame[] = [
  makeOwnedGame({ appId: 1, name: "Hades", status: "backlog", backlogRank: 0 }),
  makeOwnedGame({ appId: 2, name: "Tunic", status: "backlog", backlogRank: 1 }),
  makeOwnedGame({ appId: 3, name: "Celeste", status: "backlog" }),
];
const gameKey = (g: OwnedGame) => `${g.platform}_${g.appId}`;
const positions = new Map([
  ["steam_1", 1],
  ["steam_2", 2],
]);

// jsdom lays nothing out: place each spine side by side, as on the shelf.
beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    const index = Number(this.closest("[data-shelf-index]")?.getAttribute("data-shelf-index") ?? 0);
    return { x: index * 60, y: 0, left: index * 60, top: 0, right: index * 60 + 50, bottom: 200, width: 50, height: 200, toJSON: () => ({}) };
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function renderShelf() {
  const onReorder = vi.fn();
  const onOpen = vi.fn();
  render(<SortableBacklogSpines games={shelf} queuePositions={positions} gameKey={gameKey} onOpen={onOpen} onReorder={onReorder} />);
  return { onReorder, onOpen };
}

const pressOn = (el: Element, code: string) => act(() => void fireEvent.keyDown(el, { code, key: code === "Space" ? " " : code }));

describe("SortableBacklogSpines", () => {
  it("shelves the backlog in queue order, as spines that can be moved", () => {
    renderShelf();

    const spines = screen.getAllByRole("button");
    expect(spines.map((s) => s.getAttribute("aria-label"))).toEqual(["Hades", "Tunic", "Celeste"]);
    expect(spines.every((s) => s.getAttribute("aria-roledescription") === "livre déplaçable")).toBe(true);
    expect(spines[0].getAttribute("data-queue-position")).toBe("1");
  });

  it("still opens a game with a click", () => {
    const { onOpen } = renderShelf();

    fireEvent.click(screen.getByRole("button", { name: "Tunic" }));

    expect(onOpen).toHaveBeenCalledWith(shelf[1]);
  });

  it("moves a game from the keyboard and passes on the new queue", async () => {
    const { onReorder } = renderShelf();
    const celeste = screen.getByRole("button", { name: "Celeste" });
    celeste.focus();

    await pressOn(celeste, "Space");
    await pressOn(celeste, "ArrowLeft");
    await pressOn(celeste, "ArrowLeft");
    await pressOn(celeste, "Space");

    // Moved left of Tunic: Celeste joins the queue ahead of it.
    expect(onReorder).toHaveBeenCalledTimes(1);
    const [queue] = onReorder.mock.calls[0] as [OwnedGame[]];
    expect(queue).toHaveLength(3);
    expect(queue.indexOf(shelf[2])).toBeLessThan(queue.indexOf(shelf[1]));
  });

  it("explains how to move a game, in French", () => {
    renderShelf();

    expect(screen.getByText(/Espace pour prendre ce jeu/)).toBeTruthy();
  });
});
