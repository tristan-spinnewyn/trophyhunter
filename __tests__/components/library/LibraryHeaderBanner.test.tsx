// @vitest-environment jsdom
// __tests__/components/library/LibraryHeaderBanner.test.tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { LibraryHeaderBanner } from "@/components/library/LibraryHeaderBanner";
import type { TrackingSummary } from "@/lib/library/library-tracking";

function makeSummary(overrides: Partial<TrackingSummary> = {}): TrackingSummary {
  return {
    countByStatus: { backlog: 3, "in-progress": 2, paused: 0, completed: 5, abandoned: 1 },
    totalHours: 120,
    unlockedAchievements: 0,
    perfectGames: 0,
    ...overrides,
  };
}

describe("LibraryHeaderBanner", () => {
  afterEach(cleanup);

  it("counts the games and opens the add-game flow", () => {
    const onOpenAddGame = vi.fn();
    render(<LibraryHeaderBanner ownedGamesCount={11} onOpenAddGame={onOpenAddGame} trackingSummary={makeSummary()} />);

    expect(screen.getByText("11 jeux sur Steam, Xbox, Epic Games et GOG")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /^Ajouter/ }));
    expect(onOpenAddGame).toHaveBeenCalled();
  });

  it("uses the singular for a single game", () => {
    render(<LibraryHeaderBanner ownedGamesCount={1} onOpenAddGame={vi.fn()} trackingSummary={makeSummary()} />);

    expect(screen.getByText("1 jeu sur Steam, Xbox, Epic Games et GOG")).toBeTruthy();
  });

  it("hides the count and the tiles while loading or empty", () => {
    render(<LibraryHeaderBanner ownedGamesCount={0} isLoading onOpenAddGame={vi.fn()} trackingSummary={makeSummary()} />);

    expect(screen.queryByText(/sur Steam, Xbox/)).toBeNull();
    expect(screen.queryByText("En cours")).toBeNull();
  });

  it("summarises the tracking status, with achievements as a footnote", () => {
    render(
      <LibraryHeaderBanner
        ownedGamesCount={11}
        onOpenAddGame={vi.fn()}
        trackingSummary={makeSummary({ unlockedAchievements: 250, perfectGames: 2 })}
      />
    );

    expect(screen.getByText("En cours").nextElementSibling?.textContent).toBe("2");
    expect(screen.getByText("120 h")).toBeTruthy();
    expect(screen.getByText(/250 succès débloqués/).textContent).toContain("2 jeux à 100 %");
  });

  it("uses the singular for a single perfect game and omits it when there is none", () => {
    render(
      <LibraryHeaderBanner
        ownedGamesCount={11}
        onOpenAddGame={vi.fn()}
        trackingSummary={makeSummary({ unlockedAchievements: 5, perfectGames: 1 })}
      />
    );
    expect(screen.getByText(/5 succès débloqués/).textContent).toContain("1 jeu à 100 %");
    cleanup();

    render(
      <LibraryHeaderBanner
        ownedGamesCount={11}
        onOpenAddGame={vi.fn()}
        trackingSummary={makeSummary({ unlockedAchievements: 5 })}
      />
    );
    expect(screen.getByText(/5 succès débloqués/).textContent).not.toContain("100 %");
  });
});
