// app/api/user/goals/route.ts
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { deleteUserGoal } from "@/lib/db";
import { isGoalYear, parseGoalInput, parseGoalKey } from "@/lib/goals/year-goals";
import { getYearGoalProgress, setYearGoal } from "@/lib/goals/goals.services";

const unauthenticated = () => NextResponse.json({ error: "Non authentifié" }, { status: 401 });
const badRequest = (error: string) => NextResponse.json({ error }, { status: 400 });
const goalsOf = (userId: string, year: number) => NextResponse.json({ goals: getYearGoalProgress(userId, year, new Date()) });

/** The goals of `?year=` (the current year by default) with their progress. */
export async function GET(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthenticated();

  const yearParam = new URL(request.url).searchParams.get("year");
  const year = yearParam === null ? new Date().getUTCFullYear() : Number(yearParam);
  if (!isGoalYear(year)) return badRequest("Année invalide.");
  return goalsOf(user.id, year);
}

/** Sets (or changes) a goal: { year, kind, target }. */
export async function PUT(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthenticated();

  const input = parseGoalInput(await request.json().catch(() => null));
  if (!input.ok) return badRequest(input.error);
  setYearGoal(user.id, input.goal);
  return goalsOf(user.id, input.goal.year);
}

/** Removes a goal: { year, kind }. */
export async function DELETE(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthenticated();

  const input = parseGoalKey(await request.json().catch(() => null));
  if (!input.ok) return badRequest(input.error);
  if (!deleteUserGoal(user.id, input.key)) {
    return NextResponse.json({ error: "Objectif introuvable." }, { status: 404 });
  }
  return goalsOf(user.id, input.key.year);
}
