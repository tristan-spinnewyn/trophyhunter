// components/library/hooks/useRecentPlaySessions.ts
"use client";

import { useEffect, useState } from "react";
import type { PlaySession } from "@/lib/types";
import { recentWeekStart } from "@/lib/library/session-feed";

/** The signed-in user's play sessions of the last seven days; empty when signed out or on error. */
export function useRecentPlaySessions(isSignedIn: boolean, now?: Date): readonly PlaySession[] {
  const [since] = useState(() => recentWeekStart(now ?? new Date()));
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
