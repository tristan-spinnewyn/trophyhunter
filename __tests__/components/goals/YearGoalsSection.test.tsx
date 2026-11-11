// @vitest-environment jsdom
// __tests__/components/goals/YearGoalsSection.test.tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { YearGoalsSection } from "@/components/goals/YearGoalsSection";
import type { GoalProgress } from "@/lib/goals/goal-progress";

afterEach(cleanup);

const finished: GoalProgress = {
  year: 2027, kind: "games-finished", target: 12, baseline: null, current: 5, ratio: 5 / 12, isReached: false, pace: "behind",
};

function renderSection(goals: GoalProgress[] = [finished], error: string | null = null) {
  const props = { goals, error, onSetGoal: vi.fn(), onRemoveGoal: vi.fn() };
  render(<YearGoalsSection {...props} />);
  return props;
}

describe("YearGoalsSection", () => {
  it("shows the progress of a goal that is set, with its pace", () => {
    renderSection();

    const row = screen.getByRole("group", { name: "Jeux à terminer" });
    expect(within(row).getByText("5 / 12 jeux terminés")).toBeTruthy();
    expect(within(row).getByText("En retard sur le rythme")).toBeTruthy();
    expect(within(row).getByRole("progressbar").getAttribute("aria-valuenow")).toBe("5");
  });

  it("offers to set the goals that are not set yet", () => {
    const props = renderSection();
    const row = screen.getByRole("group", { name: "Heures à jouer" });

    expect(within(row).queryByRole("progressbar")).toBeNull();
    fireEvent.change(within(row).getByLabelText("Objectif"), { target: { value: "200" } });
    fireEvent.click(within(row).getByRole("button", { name: "Fixer" }));

    expect(props.onSetGoal).toHaveBeenCalledWith("hours-played", 200);
  });

  it("changes a target and removes a goal", () => {
    const props = renderSection();
    const row = screen.getByRole("group", { name: "Jeux à terminer" });

    const field = within(row).getByLabelText("Objectif") as HTMLInputElement;
    expect(field.value).toBe("12");
    fireEvent.change(field, { target: { value: "15" } });
    fireEvent.click(within(row).getByRole("button", { name: "Fixer" }));
    expect(props.onSetGoal).toHaveBeenCalledWith("games-finished", 15);

    fireEvent.click(within(row).getByRole("button", { name: "Retirer" }));
    expect(props.onRemoveGoal).toHaveBeenCalledWith("games-finished");
  });

  it("sets nothing from an empty or invalid target", () => {
    const props = renderSection([]);
    const row = screen.getByRole("group", { name: "Heures à jouer" });

    fireEvent.click(within(row).getByRole("button", { name: "Fixer" }));
    fireEvent.change(within(row).getByLabelText("Objectif"), { target: { value: "0" } });
    fireEvent.click(within(row).getByRole("button", { name: "Fixer" }));

    expect(props.onSetGoal).not.toHaveBeenCalled();
  });

  it("shows why a change was refused", () => {
    renderSection([], "Objectif invalide.");

    expect(screen.getByRole("alert").textContent).toBe("Objectif invalide.");
  });
});
