// components/goals/YearGoalsSummary.tsx
import type { GoalProgress } from "@/lib/goals/goal-progress";
import { GoalGauge } from "./GoalGauge";

interface YearGoalsSummaryProps {
  readonly year: number;
  readonly goals: readonly GoalProgress[];
  readonly onOpenYear: () => void;
}

/** The current year's goals at a glance on the home page; nothing until a goal is set. */
export function YearGoalsSummary({ year, goals, onOpenYear }: YearGoalsSummaryProps) {
  if (goals.length === 0) return null;

  return (
    <section aria-labelledby="year-goals-summary-title" className="rounded-control border border-edge bg-plank px-4 py-3">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h2 id="year-goals-summary-title" className="font-semiwide text-sm font-bold text-paper">
          Objectifs {year}
        </h2>
        <button type="button" onClick={onOpenYear} className="text-sm text-dust transition hover:text-paper">
          Voir mon année
        </button>
      </div>
      <ul className="space-y-3">
        {goals.map((goal) => (
          <li key={goal.kind}>
            <GoalGauge goal={goal} />
          </li>
        ))}
      </ul>
    </section>
  );
}
