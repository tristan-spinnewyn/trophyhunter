// @vitest-environment jsdom
// __tests__/components/series/GameSeriesSection.test.tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { GameSeriesSection } from "@/components/series/GameSeriesSection";
import type { SeriesView } from "@/lib/series/series.types";

afterEach(cleanup);

const series: SeriesView = {
  name: "Dark Souls",
  total: 3,
  ownedCount: 1,
  finishedCount: 1,
  members: [
    { igdbGameId: 1, name: "Dark Souls", releaseDate: "2011-09-22T00:00:00.000Z", owned: { appId: 570940, platform: "steam", status: "completed" } },
    { igdbGameId: 2, name: "Dark Souls II", releaseDate: "2014-03-11T00:00:00.000Z", steamAppId: 236430 },
    { igdbGameId: 3, name: "Dark Souls III", steamAppId: 374320 },
    { igdbGameId: 4, name: "Dark Souls Arcade" },
  ],
};

function renderSection(wishlistIds: number[] = [374320]) {
  const props = { series, wishlistIds, onWish: vi.fn(), onOpenGame: vi.fn() };
  render(<GameSeriesSection {...props} />);
  return props;
}

const row = (name: string) => screen.getByRole("listitem", { name });

describe("GameSeriesSection", () => {
  it("sums up the series and lists its games with their year", () => {
    renderSection();

    expect(screen.getByRole("heading", { name: "Série : Dark Souls" })).toBeTruthy();
    expect(screen.getByText("1 / 3 dans ta collection · 1 terminé")).toBeTruthy();
    expect(within(row("Dark Souls II")).getByText("2014")).toBeTruthy();
  });

  it("shows the status of an owned game and opens it", () => {
    const props = renderSection();

    fireEvent.click(within(row("Dark Souls")).getByRole("button", { name: "Dark Souls" }));

    expect(within(row("Dark Souls")).getByText("Terminé")).toBeTruthy();
    expect(props.onOpenGame).toHaveBeenCalledWith(570940);
  });

  it("offers to wish for a missing game sold on Steam", () => {
    const props = renderSection();

    fireEvent.click(within(row("Dark Souls II")).getByRole("button", { name: "Ajouter Dark Souls II à la liste d'envies" }));

    expect(props.onWish).toHaveBeenCalledWith(series.members[1]);
    expect(within(row("Dark Souls III")).getByText("Dans ta liste d'envies")).toBeTruthy();
    expect(within(row("Dark Souls Arcade")).getByText("Pas dans ta collection")).toBeTruthy();
  });
});
