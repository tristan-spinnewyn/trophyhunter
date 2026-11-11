// app/annee/page.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUserData } from "@/context/UserDataContext";
import { usePlaySessions } from "@/components/library/hooks/usePlaySessions";
import { YearReviewView } from "@/components/year-review/YearReviewView";
import { buildYearReview, reviewYears } from "@/lib/library/year-review";

/** "Mon année": one calendar year of gaming, the current one first. */
export default function YearReviewPage() {
  const router = useRouter();
  const { ownedGames, currentUser } = useUserData();
  const sessions = usePlaySessions(Boolean(currentUser));
  const years = reviewYears(ownedGames, sessions, new Date());
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const year = selectedYear ?? years[0];

  return (
    <YearReviewView
      review={buildYearReview(year, ownedGames, sessions)}
      years={years}
      onSelectYear={setSelectedYear}
      onOpenGame={(appId) => router.push(`/game/${appId}`)}
    />
  );
}
