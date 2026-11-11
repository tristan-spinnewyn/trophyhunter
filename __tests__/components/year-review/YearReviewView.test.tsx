// @vitest-environment jsdom
// __tests__/components/year-review/YearReviewView.test.tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { YearReviewView } from "@/components/year-review/YearReviewView";
import type { YearReview } from "@/lib/library/year-review";
import { makeOwnedGame } from "../../helpers/gameFixtures";

const hades = makeOwnedGame({ appId: 1, name: "Hades", status: "completed", completedAt: "2026-03-01T12:00:00.000Z", rating: 5 });
const anthem = makeOwnedGame({ appId: 4, name: "Anthem", status: "abandoned", abandonedAt: "2026-02-01T12:00:00.000Z", rating: 1 });

const review: YearReview = {
  year: 2026,
  finished: [hades],
  abandoned: [anthem],
  hoursPlayed: 22,
  mostPlayed: { appId: 2, platform: "gog", name: "Celeste", minutes: 720, lastDetectedAt: "2026-07-20T20:00:00.000Z" },
  topPlatform: { platform: "gog", hours: 12 },
  perfectCount: 1,
  bestRated: [hades, anthem],
};

function renderView(overrides: Partial<Parameters<typeof YearReviewView>[0]> = {}) {
  const props = { review, years: [2026, 2025], onSelectYear: vi.fn(), onOpenGame: vi.fn(), ...overrides };
  render(<YearReviewView {...props} />);
  return props;
}

describe("YearReviewView", () => {
  afterEach(cleanup);

  it("sums up the year in tiles", () => {
    renderView();

    expect(screen.getByRole("heading", { level: 1, name: "Mon année 2026" })).toBeTruthy();
    const tiles = screen.getByRole("group", { name: "Chiffres de l'année" });
    expect(within(tiles).getByText("Terminés").nextSibling?.textContent).toBe("1");
    expect(within(tiles).getByText("Abandonnés").nextSibling?.textContent).toBe("1");
    expect(within(tiles).getByText("Heures jouées").nextSibling?.textContent).toBe("22 h");
    expect(within(tiles).getByText("Jeux à 100 %").nextSibling?.textContent).toBe("1");
  });

  it("names the platform and the game of the year", () => {
    renderView();

    expect(screen.getByText("Plateforme de l'année").parentElement?.textContent).toContain("GOG Galaxy12 h");
    expect(screen.getByText("Celeste").parentElement?.textContent).toContain("12 h");
  });

  it("names the platform of the year from the finishes when no hours are known", () => {
    renderView({ review: { ...review, hoursPlayed: 0, mostPlayed: null, topPlatform: { platform: "steam", hours: null } } });

    expect(screen.getByText("Plateforme de l'année").parentElement?.textContent).toContain("Steamle plus de jeux terminés");
    expect(screen.queryByText("Le plus joué")).toBeNull();
  });

  it("lists the best-rated games and opens one", () => {
    const { onOpenGame } = renderView();
    const best = screen.getByRole("region", { name: "Tes meilleures notes" });

    expect(within(best).getAllByRole("listitem").map((li) => li.textContent)).toEqual(["Hades5/5", "Anthem1/5"]);
    fireEvent.click(within(best).getByRole("button", { name: /Hades/ }));
    expect(onOpenGame).toHaveBeenCalledWith(1);
  });

  it("lists the abandoned games", () => {
    renderView();

    expect(within(screen.getByRole("region", { name: "Abandonnés en 2026" })).getByText("Anthem")).toBeTruthy();
  });

  it("switches year", () => {
    const { onSelectYear } = renderView();

    fireEvent.change(screen.getByLabelText("Année"), { target: { value: "2025" } });

    expect(onSelectYear).toHaveBeenCalledWith(2025);
  });

  it("says when the year is still empty", () => {
    renderView({
      review: { year: 2026, finished: [], abandoned: [], hoursPlayed: 0, mostPlayed: null, topPlatform: null, perfectCount: 0, bestRated: [] },
    });

    expect(screen.getByText(/Rien de terminé ni de joué en 2026 pour l'instant/)).toBeTruthy();
    expect(screen.queryByRole("group", { name: "Chiffres de l'année" })).toBeNull();
  });
});
