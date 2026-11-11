// @vitest-environment jsdom
// __tests__/components/library/section/StaleInProgressNotice.test.tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { StaleInProgressNotice } from "@/components/library/section/StaleInProgressNotice";
import { makeOwnedGame } from "../../../helpers/gameFixtures";

const NOW = new Date("2026-11-11T12:00:00.000Z");
const forgotten = makeOwnedGame({
  appId: 7,
  name: "Hollow Knight",
  status: "in-progress",
  statusChangedAt: "2026-06-01T12:00:00.000Z",
  lastPlayed: "2026-08-01T12:00:00.000Z",
});

describe("StaleInProgressNotice", () => {
  afterEach(cleanup);

  it("offers to pause an in-progress game left aside", () => {
    const onUpdateGameStatus = vi.fn();
    render(<StaleInProgressNotice games={[forgotten]} staleAfterWeeks={6} onUpdateGameStatus={onUpdateGameStatus} now={NOW} />);

    expect(screen.getByRole("region", { name: "Jeux en cours délaissés" })).toBeTruthy();
    expect(screen.getByText(/Hollow Knight/).parentElement?.textContent).toContain("rien depuis 3 mois");

    fireEvent.click(screen.getByRole("button", { name: "Mettre Hollow Knight en pause" }));
    expect(onUpdateGameStatus).toHaveBeenCalledWith(7, "steam", "paused");
  });

  it("keeps it in progress, which dates the choice again", () => {
    const onUpdateGameStatus = vi.fn();
    render(<StaleInProgressNotice games={[forgotten]} staleAfterWeeks={6} onUpdateGameStatus={onUpdateGameStatus} now={NOW} />);

    fireEvent.click(screen.getByRole("button", { name: "Garder Hollow Knight en cours" }));

    expect(onUpdateGameStatus).toHaveBeenCalledWith(7, "steam", "in-progress");
  });

  it("renders nothing when every in-progress game is being played", () => {
    const { container } = render(
      <StaleInProgressNotice games={[forgotten]} staleAfterWeeks={52} onUpdateGameStatus={vi.fn()} now={NOW} />
    );

    expect(container.innerHTML).toBe("");
  });
});
