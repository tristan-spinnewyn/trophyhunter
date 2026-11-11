// components/library/hooks/useRecentPlaySessions.ts
"use client";

import { useEffect, useState } from "react";
import type { PlaySession } from "@/lib/types";
import { daysBefore } from "@/lib/library/session-feed";

interface RecentPlaySessionsOptions {
  /** How many days back to load. */
  readonly days: number;
  readonly now?: Date;
}

/** The signed-in user's play sessions of the last `days` days; empty when signed out or on error. */
export function useRecentPlaySessions(isSignedIn: boolean, { days, now }: RecentPlaySessionsOptions): readonly PlaySession[] {
  const [since] = useState(() => daysBefore(now ?? new Date(), days));
  const [sessions, setSessions] = useState<readonly PlaySession[]>([]);

  useEffect(() => {
    if (!isSignedIn) return;
    let isCurrent = true;
    fetch(`/api/user/sessions?since=${encodeURIComponent(since)}`)
      .then((res) => (res.ok ? res.json() : { sessions: [] }))
      .then((data: { sessions?: PlaySession[] }) => {
        if (isCurrent) setSessions(data.sessions ?? []);
      })
      .catch(() => {
        if (isCurrent) setSessions([]);
      });
    return () => {
      isCurrent = false;
    };
  }, [isSignedIn, since]);

  return isSignedIn ? sessions : [];
}
