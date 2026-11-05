// components/library/TrackingSummaryTiles.tsx

import { Play, ListTodo, CheckCircle2, Clock, Trophy } from "lucide-react";
import type { TrackingSummary } from "@/lib/library/library-tracking";
import { StatTileGrid } from "@/components/stats/StatTileGrid";

/** What I'm playing, what's next, what I finished; achievements stay a footnote. */
export function TrackingSummaryTiles({ summary }: { readonly summary: TrackingSummary }) {
  const { countByStatus, totalHours, perfectGames, unlockedAchievements } = summary;

  return (
    <div className="space-y-2">
      <StatTileGrid
        tiles={[
          { label: "En cours", value: countByStatus["in-progress"], icon: Play, iconClass: "text-lamp-bright" },
          { label: "À jouer", value: countByStatus.backlog, icon: ListTodo, iconClass: "text-dust" },
          { label: "Terminés", value: countByStatus.completed, icon: CheckCircle2, iconClass: "text-done" },
          { label: "Temps de jeu", value: `${totalHours} h`, icon: Clock, iconClass: "text-dust" },
        ]}
      />
      {unlockedAchievements > 0 && (
        <p className="flex items-center gap-1.5 text-xs text-faint">
          <Trophy className="h-3.5 w-3.5 text-lamp-bright/80" aria-hidden />
          {unlockedAchievements} succès débloqués
          {perfectGames > 0 && ` · ${perfectGames} ${perfectGames > 1 ? "jeux" : "jeu"} à 100 %`}
        </p>
      )}
    </div>
  );
}
