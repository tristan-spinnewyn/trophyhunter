// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { makeOwnedGame } from "../../helpers/gameFixtures";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const thisYear = new Date().getUTCFullYear();
const userData = {
  currentUser: null as { id: string } | null,
  ownedGames: [
    makeOwnedGame({ appId: 1, name: "Hades", status: "completed", completedAt: `${thisYear}-03-01T12:00:00.000Z`, rating: 5 }),
    makeOwnedGame({ appId: 2, name: "Portal", status: "completed", completedAt: `${thisYear - 1}-05-01T12:00:00.000Z`, rating: 4 }),
  ],
};
vi.mock("@/context/UserDataContext", () => ({ useUserData: () => userData }));

import YearReviewPage from "@/app/annee/page";

const bestRated = () => screen.getByRole("region", { name: "Tes meilleures notes" });

describe("YearReviewPage", () => {
  beforeEach(() => {
    userData.currentUser = null;
    push.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("opens on the current year and switches to an earlier one", () => {
    render(<YearReviewPage />);

    expect(screen.getByRole("heading", { level: 1, name: `Mon année ${thisYear}` })).toBeTruthy();
    expect(within(bestRated()).getByRole("button", { name: /Hades/ })).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Année"), { target: { value: String(thisYear - 1) } });

    expect(screen.getByRole("heading", { level: 1, name: `Mon année ${thisYear - 1}` })).toBeTruthy();
    expect(within(bestRated()).getByRole("button", { name: /Portal/ })).toBeTruthy();
  });

  it("offers yearly goals to a signed-in user only", async () => {
    render(<YearReviewPage />);
    expect(screen.queryByRole("region", { name: "Objectifs" })).toBeNull();
    cleanup();

    userData.currentUser = { id: "u1" };
    vi.spyOn(global, "fetch").mockResolvedValue(new Response(JSON.stringify({ sessions: [], goals: [] })));
    render(<YearReviewPage />);

    expect(await screen.findByRole("region", { name: "Objectifs" })).toBeTruthy();
  });

  it("opens a game's page", () => {
    render(<YearReviewPage />);

    fireEvent.click(within(bestRated()).getByRole("button", { name: /Hades/ }));

    expect(push).toHaveBeenCalledWith("/game/1");
  });

  it("counts the hours of the signed-in user's sessions", async () => {
    userData.currentUser = { id: "u1" };
    const sessions = [{ appId: 1, platform: "steam", name: "Hades", minutes: 180, detectedAt: `${thisYear}-02-01T20:00:00.000Z` }];
    vi.spyOn(global, "fetch").mockResolvedValue(new Response(JSON.stringify({ sessions })));

    render(<YearReviewPage />);

    const tiles = await screen.findByRole("group", { name: "Chiffres de l'année" });
    expect(await within(tiles).findByText("3 h")).toBeTruthy();
  });
});
