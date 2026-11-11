// components/library/hooks/useRecentPlaySessions.ts
"use client";

import { useState } from "react";
import type { PlaySession } from "@/lib/types";
import { daysBefore } from "@/lib/library/session-feed";
import { usePlaySessions } from "./usePlaySessions";

interface RecentPlaySessionsOptions {
  /** How many days back to load. */
  readonly days: number;
  readonly now?: Date;
}

/** The signed-in user's play sessions of the last `days` days; empty when signed out or on error. */
export function useRecentPlaySessions(isSignedIn: boolean, { days, now }: RecentPlaySessionsOptions): readonly PlaySession[] {
  // Fixed at mount, so the request is not repeated on every render.
  const [since] = useState(() => daysBefore(now ?? new Date(), days));
  return usePlaySessions(isSignedIn, since);
}
