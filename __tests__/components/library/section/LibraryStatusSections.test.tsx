// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { LibraryStatusSections } from "@/components/library/section/LibraryStatusSections";
import { makeOwnedGame } from "../../../helpers/gameFixtures";
import type { OwnedGame } from "@/lib/types";

afterEach(cleanup);

const games: OwnedGame[] = [
  makeOwnedGame({ appId: 1, name: "Hollow Knight", status: "in-progress" }),
  makeOwnedGame({ appId: 2, name: "Hades", status: "backlog" }),
  makeOwnedGame({ appId: 3, name: "Starfield", status: "paused" }),
  makeOwnedGame({ appId: 4, name: "Portal", status: "completed" }),
];

const renderCard = (g: OwnedGame) => <article key={g.appId} data-testid={`card-${g.appId}`}>{g.name} card</article>;

function renderSections() {
  return render(<LibraryStatusSections games={games} renderGame={renderCard} />);
}

describe("LibraryStatusSections", () => {
  it("shows the games being played face-out, as full cards", () => {
    renderSections();
    const playing = screen.getByRole("region", { name: "En cours" });
    expect(within(playing).getByTestId("card-1")).toBeTruthy();
  });

  it("shelves the other games as spines named after the game", () => {
    renderSections();
    const backlog = screen.getByRole("region", { name: "À jouer" });
    expect(within(backlog).getByRole("button", { name: "Hades" })).toBeTruthy();
    expect(screen.queryByTestId("card-2")).toBeNull();
  });

  it("opens a spine's game in a dialog with its full card", () => {
    renderSections();
    fireEvent.click(screen.getByRole("button", { name: "Hades" }));

    const dialog = screen.getByRole("dialog", { name: "Hades" });
    expect(within(dialog).getByTestId("card-2")).toBeTruthy();

    fireEvent.click(within(dialog).getByRole("button", { name: "Fermer" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("keeps the backlog open and folds paused and finished games", () => {
    const { container } = renderSections();
    const openTitles = [...container.querySelectorAll("details[open] summary")].map((s) => s.textContent);
    const folded = [...container.querySelectorAll("details:not([open]) summary")].map((s) => s.textContent);

    expect(openTitles.join()).toContain("À jouer");
    expect(folded.join()).toContain("En pause");
    expect(folded.join()).toContain("Terminés");
  });

  it("counts the games on each shelf", () => {
    renderSections();
    const backlog = screen.getByRole("region", { name: "À jouer" });
    expect(within(backlog).getByText("1")).toBeTruthy();
  });
});
