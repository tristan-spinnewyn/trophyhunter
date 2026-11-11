// components/goals/GoalGauge.tsx
import { describeGoalPace, describeGoalProgress, type GoalProgress } from "@/lib/goals/goal-progress";

/** A goal's progress bar, its figures and its pace. */
export function GoalGauge({ goal }: { readonly goal: GoalProgress }) {
  const pace = describeGoalPace(goal);
  return (
    <div className="space-y-1">
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={goal.target}
        aria-valuenow={Math.min(goal.current, goal.target)}
        aria-label={describeGoalProgress(goal)}
        className="h-1.5 w-full overflow-hidden rounded-control bg-edge"
      >
        <div className={`h-full ${goal.isReached ? "bg-done" : "bg-paper-dim"}`} style={{ width: `${goal.ratio * 100}%` }} />
      </div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
        <span className="tabular-nums text-paper-dim">{describeGoalProgress(goal)}</span>
        {pace && <span className={goal.isReached ? "text-done" : "text-dust"}>{pace}</span>}
      </div>
    </div>
  );
}
