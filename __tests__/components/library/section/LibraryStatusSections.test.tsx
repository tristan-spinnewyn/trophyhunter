// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
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
  makeOwnedGame({ appId: 5, name: "Celeste", status: undefined }),
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
    const backlog = screen.getByRole("region", { name: "Backlog" });
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

  it("reminds where you left off when a paused game is taken off the shelf", () => {
    render(
      <LibraryStatusSections
        games={[makeOwnedGame({ appId: 3, name: "Starfield", status: "paused", resumeNote: "Quête de Constellation." })]}
        renderGame={renderCard}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Starfield" }));

    expect(within(screen.getByRole("dialog", { name: "Starfield" })).getByText("Où tu en étais : Quête de Constellation.")).toBeTruthy();
  });

  it("keeps the backlog open and folds paused, unsorted and finished games", () => {
    const { container } = renderSections();
    const openTitles = [...container.querySelectorAll("details[open] summary")].map((s) => s.textContent);
    const folded = [...container.querySelectorAll("details:not([open]) summary")].map((s) => s.textContent);

    expect(openTitles.join()).toContain("Backlog");
    expect(folded.join()).toContain("Non triés");
    expect(folded.join()).toContain("En pause");
    expect(folded.join()).toContain("Terminés");
  });

  it("shelves a game without a status as unsorted rather than in the backlog", () => {
    renderSections();
    const unsorted = screen.getByRole("region", { name: "Non triés" });
    expect(within(unsorted).getByRole("button", { name: "Celeste" })).toBeTruthy();
  });

  it("offers to sort the unsorted shelf one game at a time", () => {
    const onUpdateGameStatus = vi.fn();
    const { container } = render(
      <LibraryStatusSections games={games} renderGame={renderCard} onUpdateGameStatus={onUpdateGameStatus} />
    );
    const unsorted = screen.getByRole("region", { name: "Non triés" });

    fireEvent.click(within(unsorted).getByRole("button", { name: "Trier" }));

    const triage = screen.getByRole("dialog", { name: "Trier mes jeux" });
    expect(within(triage).getByRole("heading", { level: 3 }).textContent).toBe("Celeste");
    expect(unsorted.querySelector("details")?.open).toBe(false);
    expect(container.querySelectorAll("[role=dialog]")).toHaveLength(1);

    fireEvent.click(within(triage).getByRole("button", { name: /^Backlog/ }));
    expect(onUpdateGameStatus).toHaveBeenCalledWith(5, "steam", "backlog");

    fireEvent.click(within(triage).getByRole("button", { name: "Terminer" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("has no sorting entry point when statuses cannot be changed", () => {
    renderSections();
    expect(screen.queryByRole("button", { name: "Trier" })).toBeNull();
  });

  describe("backlog queue", () => {
    const queueGames: OwnedGame[] = [
      makeOwnedGame({ appId: 6, name: "Tunic", status: "backlog" }),
      makeOwnedGame({ appId: 2, name: "Hades", status: "backlog", backlogRank: 0 }),
      makeOwnedGame({ appId: 3, name: "Starfield", status: "paused" }),
    ];

    function renderQueue() {
      const onPlayNext = vi.fn();
      const onRemoveFromQueue = vi.fn();
      render(
        <LibraryStatusSections games={queueGames} renderGame={renderCard} onPlayNext={onPlayNext} onRemoveFromQueue={onRemoveFromQueue} />
      );
      return { onPlayNext, onRemoveFromQueue };
    }

    describe("time to beat", () => {
      const durations = { steam_2: { hastilySeconds: 20 * 3600, normallySeconds: 22 * 3600, completelySeconds: 95 * 3600 } };

      it("shows on each backlog spine how long the game takes, whether the queue can be dragged or not", () => {
        for (const onReorderQueue of [undefined, vi.fn()]) {
          const { unmount } = render(
            <LibraryStatusSections games={queueGames} renderGame={renderCard} backlogDurations={durations} onReorderQueue={onReorderQueue} />
          );

          const hades = screen.getByRole("button", { name: "Hades" });
          expect(hades.querySelector(".spine-duration")?.textContent).toBe("22 h");
          expect(screen.getByRole("button", { name: "Tunic" }).querySelector(".spine-duration")).toBeNull();
          unmount();
        }
      });

      it("says how long the whole backlog takes at the recent pace", () => {
        const recentSessions = [
          { appId: 9, platform: "steam" as const, name: "X", minutes: 13 * 60, detectedAt: new Date().toISOString() },
        ];
        render(<LibraryStatusSections games={queueGames} renderGame={renderCard} backlogDurations={durations} recentSessions={recentSessions} />);

        const backlog = screen.getByRole("region", { name: "Backlog" });
        expect(within(backlog).getByText(/^≈ 22 h · environ 5 mois à ton rythme · dont \d+ jeux? sans durée connue$/)).toBeTruthy();
      });

      it("spells out the durations in the game's dialog", () => {
        render(<LibraryStatusSections games={queueGames} renderGame={renderCard} backlogDurations={durations} />);
        fireEvent.click(screen.getByRole("button", { name: "Hades" }));

        const dialog = screen.getByRole("dialog", { name: "Hades" });
        expect(within(dialog).getByText("Environ 22 h · histoire seule 20 h · à 100 % 95 h")).toBeTruthy();
      });
    });

    it("shelves queued games first and numbers their spines", () => {
      renderQueue();
      const backlog = screen.getByRole("region", { name: "Backlog" });
      const spines = within(backlog).getAllByRole("button");

      expect(spines.map((s) => s.getAttribute("aria-label"))).toEqual(["Hades", "Tunic"]);
      expect(spines[0].getAttribute("data-queue-position")).toBe("1");
      expect(spines[1].hasAttribute("data-queue-position")).toBe(false);
    });

    it("lets a backlog game be played next from its dialog", () => {
      const { onPlayNext } = renderQueue();
      fireEvent.click(screen.getByRole("button", { name: "Tunic" }));

      const dialog = screen.getByRole("dialog", { name: "Tunic" });
      expect(within(dialog).getByText("Hors de la file")).toBeTruthy();
      expect(within(dialog).queryByRole("button", { name: "Retirer de la file" })).toBeNull();
      fireEvent.click(within(dialog).getByRole("button", { name: "Jouer ensuite" }));

      expect(onPlayNext).toHaveBeenCalledWith(6, "steam");
    });

    it("lets the head of the queue be taken out, without offering to play it next again", () => {
      const { onRemoveFromQueue } = renderQueue();
      fireEvent.click(screen.getByRole("button", { name: "Hades" }));

      const dialog = screen.getByRole("dialog", { name: "Hades" });
      expect(within(dialog).getByText("N° 1 dans la file")).toBeTruthy();
      expect(within(dialog).queryByRole("button", { name: "Jouer ensuite" })).toBeNull();
      fireEvent.click(within(dialog).getByRole("button", { name: "Retirer de la file" }));

      expect(onRemoveFromQueue).toHaveBeenCalledWith(2, "steam");
    });

    it("lets the backlog spines be dragged into a new queue order when the queue can be saved", () => {
      render(<LibraryStatusSections games={queueGames} renderGame={renderCard} onReorderQueue={vi.fn()} />);

      const backlog = screen.getByRole("region", { name: "Backlog" });
      const spines = within(backlog).getAllByRole("button");
      expect(spines.every((s) => s.getAttribute("aria-roledescription") === "livre déplaçable")).toBe(true);
      expect(screen.getByRole("button", { name: "Starfield" }).hasAttribute("aria-roledescription")).toBe(false);
    });

    it("keeps the backlog spines still when the queue cannot be saved", () => {
      renderQueue();

      expect(screen.getByRole("button", { name: "Hades" }).hasAttribute("aria-roledescription")).toBe(false);
    });

    it("shows no queue controls outside the backlog", () => {
      renderQueue();
      fireEvent.click(screen.getByRole("button", { name: "Starfield" }));

      const dialog = screen.getByRole("dialog", { name: "Starfield" });
      expect(within(dialog).queryByRole("button", { name: "Jouer ensuite" })).toBeNull();
    });
  });

  describe("finished games by year", () => {
    const finished: OwnedGame[] = [
      makeOwnedGame({ appId: 21, name: "Portal", status: "completed" }),
      makeOwnedGame({ appId: 22, name: "Tunic", status: "completed", completedAt: "2026-03-01T10:00:00.000Z" }),
      makeOwnedGame({ appId: 23, name: "Celeste", status: "completed", completedAt: "2025-07-01T10:00:00.000Z" }),
      makeOwnedGame({ appId: 24, name: "Hades", status: "completed", completedAt: "2026-09-01T10:00:00.000Z" }),
    ];

    it("splits the finished shelf by year, latest first, with undated games last", () => {
      render(<LibraryStatusSections games={finished} renderGame={renderCard} />);
      const shelf = screen.getByRole("region", { name: "Terminés" });

      const years = within(shelf).getAllByRole("heading", { level: 4 }).map((h) => h.textContent);
      expect(years).toEqual(["2026", "2025", "Date inconnue"]);
      const thisYear = within(shelf).getByRole("group", { name: "2026" });
      expect(within(thisYear).getAllByRole("button").map((b) => b.getAttribute("aria-label"))).toEqual(["Hades", "Tunic"]);
      expect(within(within(shelf).getByRole("group", { name: "Date inconnue" })).getByRole("button", { name: "Portal" })).toBeTruthy();
    });

    it("tells how many games were finished each year", () => {
      render(<LibraryStatusSections games={finished} renderGame={renderCard} />);
      const thisYear = within(screen.getByRole("region", { name: "Terminés" })).getByRole("group", { name: "2026" });

      expect(within(thisYear).getByText("2 jeux")).toBeTruthy();
    });

    it("keeps the other shelves in one piece", () => {
      renderSections();

      expect(within(screen.getByRole("region", { name: "Backlog" })).queryByRole("heading", { level: 4 })).toBeNull();
    });
  });

  it("counts the games on each shelf", () => {
    renderSections();
    const backlog = screen.getByRole("region", { name: "Backlog" });
    expect(within(backlog).getByText("1")).toBeTruthy();
  });
});
