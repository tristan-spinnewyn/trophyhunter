// @vitest-environment jsdom
// __tests__/components/library/FeaturedGamesSection.test.tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { makeOwnedGame } from "../../helpers/gameFixtures";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const { FeaturedGamesSection, FEATURED_GAMES } = await import("@/components/library/FeaturedGamesSection");

describe("FeaturedGamesSection", () => {
  afterEach(cleanup);

  it("opens a featured game page", () => {
    render(<FeaturedGamesSection ownedGames={[]} />);
    const [first] = FEATURED_GAMES;

    fireEvent.click(screen.getByRole("button", { name: new RegExp(first.name) }));

    expect(push).toHaveBeenCalledWith(`/game/${first.id}`);
  });

  it("marks the featured games the user already owns", () => {
    const [first] = FEATURED_GAMES;
    render(<FeaturedGamesSection ownedGames={[makeOwnedGame({ appId: first.id })]} />);

    const owned = screen.getByRole("button", { name: new RegExp(first.name) });
    expect(within(owned).getByLabelText("Déjà dans ta collection")).toBeTruthy();
    expect(screen.getAllByLabelText("Déjà dans ta collection")).toHaveLength(1);
  });
});
