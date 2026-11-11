// @vitest-environment jsdom
// __tests__/components/library/tonight/TonightPickPanel.test.tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { TonightPickPanel } from "@/components/library/tonight/TonightPickPanel";
import { makeOwnedGame } from "../../../helpers/gameFixtures";
import type { GameDurations } from "@/lib/types";

afterEach(cleanup);

const hours = (h: number): GameDurations => ({ hastilySeconds: null, normallySeconds: h * 3600, completelySeconds: null });

const playing = makeOwnedGame({ appId: 1, name: "Hollow Knight", status: "in-progress", playtimeHours: 5 });
const queued = [2, 3, 4, 5].map((appId, i) => makeOwnedGame({ appId, name: `Queued ${appId}`, status: "backlog", backlogRank: i + 1 }));
const short = makeOwnedGame({ appId: 9, name: "Short", status: "backlog" });

function renderPanel(overrides: Partial<Parameters<typeof TonightPickPanel>[0]> = {}) {
  const props = {
    games: [playing, ...queued, short],
    durations: { steam_9: hours(2) },
    onSelectGame: vi.fn(),
    onStartGame: vi.fn(),
    ...overrides,
  };
  render(<TonightPickPanel {...props} />);
  return props;
}

const pickedNames = () =>
  within(screen.getByRole("list", { name: "Idées pour ce soir" }))
    .getAllByRole("listitem")
    .map((item) => within(item).getAllByRole("button")[0].textContent);

describe("TonightPickPanel", () => {
  it("offers three games for an evening by default, each with its reason", () => {
    renderPanel();

    expect(screen.getByRole("tab", { name: "Une soirée" }).getAttribute("aria-selected")).toBe("true");
    expect(pickedNames()).toEqual(["Hollow Knight", "Short", "Queued 2"]);
    expect(screen.getByText("Assez court pour tenir dedans : environ 2 h")).toBeTruthy();
  });

  it("ranks again for another amount of time", () => {
    renderPanel();

    fireEvent.click(screen.getByRole("tab", { name: "1 h" }));

    expect(pickedNames()).toEqual(["Hollow Knight", "Queued 2", "Queued 3"]);
  });

  it("shows the next ideas, then comes back to the first ones", () => {
    renderPanel();

    fireEvent.click(screen.getByRole("button", { name: "D'autres idées" }));
    expect(pickedNames()).toEqual(["Queued 3", "Queued 4", "Queued 5"]);

    fireEvent.click(screen.getByRole("button", { name: "D'autres idées" }));
    expect(pickedNames()).toEqual(["Hollow Knight", "Short", "Queued 2"]);
  });

  it("opens a game, and starts one that is not being played yet", () => {
    const props = renderPanel();
    const items = within(screen.getByRole("list", { name: "Idées pour ce soir" })).getAllByRole("listitem");

    fireEvent.click(within(items[0]).getByRole("button", { name: "Hollow Knight" }));
    expect(props.onSelectGame).toHaveBeenCalledWith(1);
    expect(within(items[0]).queryByRole("button", { name: /Commencer/ })).toBeNull();

    fireEvent.click(within(items[1]).getByRole("button", { name: "Commencer Short" }));
    expect(props.onStartGame).toHaveBeenCalledWith(short);
  });

  it("offers no extra ideas when everything already fits", () => {
    renderPanel({ games: [playing] });

    expect(screen.queryByRole("button", { name: "D'autres idées" })).toBeNull();
  });

  it("stays hidden when nothing is ahead", () => {
    const { container } = render(
      <TonightPickPanel games={[makeOwnedGame({ status: "completed" })]} durations={{}} onSelectGame={vi.fn()} onStartGame={vi.fn()} />
    );

    expect(container.innerHTML).toBe("");
  });
});
