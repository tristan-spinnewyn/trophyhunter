// components/goals/useYearGoals.ts
"use client";

import { useEffect, useState } from "react";
import type { GoalProgress } from "@/lib/goals/goal-progress";
import type { GoalKind } from "@/lib/goals/year-goals";

/** The signed-in user's goals for a year with their progress, and the calls that change them. */
export function useYearGoals(year: number, isSignedIn: boolean) {
  const [goals, setGoals] = useState<readonly GoalProgress[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSignedIn) return;
    let isCurrent = true;
    fetch(`/api/user/goals?year=${year}`)
      .then((res) => (res.ok ? res.json() : { goals: [] }))
      .then((data: { goals?: GoalProgress[] }) => {
        if (isCurrent) setGoals(data.goals ?? []);
      })
      .catch(() => {
        if (isCurrent) setGoals([]);
      });
    return () => {
      isCurrent = false;
    };
  }, [year, isSignedIn]);

  const send = async (method: "PUT" | "DELETE", body: Record<string, unknown>) => {
    try {
      const res = await fetch("/api/user/goals", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { goals?: GoalProgress[]; error?: string };
      if (!res.ok) {
        setError(data.error ?? "L'objectif n'a pas pu être enregistré.");
        return;
      }
      setError(null);
      setGoals(data.goals ?? []);
    } catch {
      setError("L'objectif n'a pas pu être enregistré.");
    }
  };

  return {
    goals: isSignedIn ? goals : [],
    error,
    setGoal: (kind: GoalKind, target: number) => send("PUT", { year, kind, target }),
    removeGoal: (kind: GoalKind) => send("DELETE", { year, kind }),
  };
}
