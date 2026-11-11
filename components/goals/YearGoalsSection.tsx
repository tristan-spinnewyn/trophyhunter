// components/goals/YearGoalsSection.tsx
"use client";

import { useId, useState } from "react";
import { GOAL_KINDS, MAX_GOAL_TARGET, type GoalKind, type GoalKindMeta } from "@/lib/goals/year-goals";
import type { GoalProgress } from "@/lib/goals/goal-progress";
import { GoalGauge } from "./GoalGauge";

interface YearGoalsSectionProps {
  readonly goals: readonly GoalProgress[];
  readonly error: string | null;
  readonly onSetGoal: (kind: GoalKind, target: number) => void;
  readonly onRemoveGoal: (kind: GoalKind) => void;
}

interface GoalRowProps {
  readonly meta: GoalKindMeta;
  readonly goal: GoalProgress | undefined;
  readonly onSetGoal: (kind: GoalKind, target: number) => void;
  readonly onRemoveGoal: (kind: GoalKind) => void;
}

function GoalRow({ meta, goal, onSetGoal, onRemoveGoal }: GoalRowProps) {
  const labelId = useId();
  const fieldId = useId();
  const [draft, setDraft] = useState(goal ? String(goal.target) : "");

  const submit = () => {
    const target = Number(draft);
    if (draft.trim() && Number.isInteger(target) && target >= 1 && target <= MAX_GOAL_TARGET) onSetGoal(meta.kind, target);
  };

  return (
    <div role="group" aria-labelledby={labelId} className="space-y-2 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 id={labelId} className="text-sm font-semibold text-paper">
          {meta.label}
        </h3>
        <div className="flex items-center gap-2">
          <label htmlFor={fieldId} className="sr-only">
            Objectif
          </label>
          <input
            id={fieldId}
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_GOAL_TARGET}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-24 rounded-control border border-edge bg-plank px-2 py-1 text-sm tabular-nums text-paper focus:border-seam focus:outline-none"
          />
          <button
            type="button"
            onClick={submit}
            className="rounded-control border border-edge px-3 py-1 text-sm text-paper-dim transition hover:border-seam hover:text-paper"
          >
            Fixer
          </button>
          {goal && (
            <button type="button" onClick={() => onRemoveGoal(meta.kind)} className="text-sm text-dust transition hover:text-paper">
              Retirer
            </button>
          )}
        </div>
      </div>
      {goal && <GoalGauge goal={goal} />}
    </div>
  );
}

/** The year's goals: one row per kind, set or not, with the progress of those that are. */
export function YearGoalsSection({ goals, error, onSetGoal, onRemoveGoal }: YearGoalsSectionProps) {
  return (
    <section aria-labelledby="year-goals-title" className="rounded-control border border-edge bg-plank px-4 py-3">
      <h2 id="year-goals-title" className="font-semiwide text-sm font-bold text-paper">
        Objectifs
      </h2>
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
      <div className="divide-y divide-edge">
        {GOAL_KINDS.map((meta) => {
          const goal = goals.find((g) => g.kind === meta.kind);
          return (
            <GoalRow key={`${meta.kind}_${goal?.target ?? ""}`} meta={meta} goal={goal} onSetGoal={onSetGoal} onRemoveGoal={onRemoveGoal} />
          );
        })}
      </div>
    </section>
  );
}
