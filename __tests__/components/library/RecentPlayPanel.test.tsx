// @vitest-environment jsdom
// __tests__/components/library/RecentPlayPanel.test.tsx
import { describe, it, expect, afterEach, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { RecentPlayPanel } from "@/components/library/RecentPlayPanel";
import type { PlaySession } from "@/lib/types";

function session(appId: number, name: string, minutes: number): PlaySession {
  return { appId, platform: "steam", name, minutes, detectedAt: "2026-11-10T20:00:00.000Z" };
}

describe("RecentPlayPanel", () => {
  afterEach(cleanup);

  it("lists the games played this week with their time, most played first", () => {
    render(
      <RecentPlayPanel
        sessions={[session(1, "Hades", 45), session(2, "Celeste", 150), session(1, "Hades", 30)]}
        onSelectGame={vi.fn()}
      />
    );

    expect(screen.getByRole("region", { name: "Cette semaine" })).toBeTruthy();
    expect(screen.getByText("3 h 45 de jeu")).toBeTruthy();
    const items = screen.getAllByRole("listitem").map((li) => li.textContent);
    expect(items).toEqual(["Celeste2 h 30", "Hades1 h 15"]);
  });

  it("opens a game when it is clicked", () => {
    const onSelectGame = vi.fn();
    render(<RecentPlayPanel sessions={[session(7, "Tunic", 60)]} onSelectGame={onSelectGame} />);

    fireEvent.click(screen.getByRole("button", { name: /Tunic/ }));

    expect(onSelectGame).toHaveBeenCalledWith(7);
  });

  it("renders nothing without sessions", () => {
    const { container } = render(<RecentPlayPanel sessions={[]} onSelectGame={vi.fn()} />);

    expect(container.innerHTML).toBe("");
  });
});
