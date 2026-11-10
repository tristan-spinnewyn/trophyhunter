// @vitest-environment jsdom
// __tests__/components/library/section/StartedBacklogNotice.test.tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { StartedBacklogNotice } from "@/components/library/section/StartedBacklogNotice";
import { makeOwnedGame } from "../../../helpers/gameFixtures";
import type { OwnedGame } from "@/lib/types";

afterEach(cleanup);

const NOW = new Date("2026-11-10T12:00:00.000Z");
const QUEUED_ON = "2026-11-01T10:00:00.000Z";

const hades = makeOwnedGame({ appId: 1, name: "Hades", status: "backlog", statusChangedAt: QUEUED_ON, lastPlayed: "2026-11-09T12:00:00.000Z" });
const tunic = makeOwnedGame({ appId: 2, name: "Tunic", platform: "gog", status: "backlog", statusChangedAt: QUEUED_ON, lastPlayed: "2026-11-07T12:00:00.000Z" });
const celeste = makeOwnedGame({ appId: 3, name: "Celeste", status: "backlog", statusChangedAt: QUEUED_ON });

function renderNotice(games: OwnedGame[] = [hades, tunic, celeste]) {
  const onUpdateGameStatus = vi.fn();
  render(<StartedBacklogNotice games={games} onUpdateGameStatus={onUpdateGameStatus} now={NOW} />);
  return { onUpdateGameStatus };
}

describe("StartedBacklogNotice", () => {
  it("lists the backlog games that were launched, with their last session", () => {
    renderNotice();

    const notice = screen.getByRole("region", { name: "Jeux du backlog lancés" });
    const items = within(notice).getAllByRole("listitem");
    expect(items.map((li) => within(li).getByText(/Hades|Tunic/).textContent)).toEqual(["Hades", "Tunic"]);
    expect(within(items[0]).getByText(/joué hier/)).toBeTruthy();
    expect(within(notice).queryByText("Celeste")).toBeNull();
  });

  it("moves a game to in progress", () => {
    const { onUpdateGameStatus } = renderNotice();

    fireEvent.click(screen.getByRole("button", { name: "Passer Hades en cours" }));

    expect(onUpdateGameStatus).toHaveBeenCalledWith(1, "steam", "in-progress");
  });

  it("keeps a game in the backlog by choosing the backlog again, which dates the choice after the session", () => {
    const { onUpdateGameStatus } = renderNotice();

    fireEvent.click(screen.getByRole("button", { name: "Laisser Tunic au backlog" }));

    expect(onUpdateGameStatus).toHaveBeenCalledWith(2, "gog", "backlog");
  });

  it("renders nothing when no backlog game was launched", () => {
    renderNotice([celeste]);

    expect(screen.queryByRole("region")).toBeNull();
  });
});
