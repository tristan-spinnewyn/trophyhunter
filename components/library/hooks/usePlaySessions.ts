// components/library/hooks/usePlaySessions.ts
"use client";

import { useEffect, useState } from "react";
import type { PlaySession } from "@/lib/types";

/** The signed-in user's play sessions since an ISO date (all of them without one); empty when signed out or on error. */
export function usePlaySessions(isSignedIn: boolean, since?: string): readonly PlaySession[] {
  const [sessions, setSessions] = useState<readonly PlaySession[]>([]);

  useEffect(() => {
    if (!isSignedIn) return;
    let isCurrent = true;
    const query = since ? `?since=${encodeURIComponent(since)}` : "";
    fetch(`/api/user/sessions${query}`)
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
