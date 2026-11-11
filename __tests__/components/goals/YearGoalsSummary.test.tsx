// @vitest-environment jsdom
// __tests__/components/goals/YearGoalsSummary.test.tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { YearGoalsSummary } from "@/components/goals/YearGoalsSummary";
import type { GoalProgress } from "@/lib/goals/goal-progress";

afterEach(cleanup);

const goals: GoalProgress[] = [
  { year: 2027, kind: "games-finished", target: 12, baseline: null, current: 5, ratio: 5 / 12, isReached: false, pace: "ahead" },
  { year: 2027, kind: "hours-played", target: 80, baseline: null, current: 84, ratio: 1, isReached: true, pace: null },
];

describe("YearGoalsSummary", () => {
  it("shows a gauge per goal of the year and opens the year review", () => {
    const onOpenYear = vi.fn();
    render(<YearGoalsSummary year={2027} goals={goals} onOpenYear={onOpenYear} />);

    expect(screen.getByRole("heading", { name: "Objectifs 2027" })).toBeTruthy();
    expect(screen.getAllByRole("progressbar")).toHaveLength(2);
    expect(screen.getByText("5 / 12 jeux terminés")).toBeTruthy();
    expect(screen.getByText("Objectif atteint")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Voir mon année" }));
    expect(onOpenYear).toHaveBeenCalled();
  });

  it("stays hidden without any goal", () => {
    const { container } = render(<YearGoalsSummary year={2027} goals={[]} onOpenYear={vi.fn()} />);

    expect(container.innerHTML).toBe("");
  });
});
