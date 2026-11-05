// components/achievement/AchievementDetailsAccordion.tsx
"use client";

import { useState } from "react";
import { Video, Trophy, BookOpen, ExternalLink } from "lucide-react";
import { buildGuideUrls } from "@/lib/game/guide-urls";

interface AccordionProps {
  gameName: string;
  achievementName: string;
  gameId: number;
  initialNotes: string;
  onSaveNotes: (notes: string) => void;
}

export function AchievementDetailsAccordion({
  gameName,
  achievementName,
  gameId,
  initialNotes,
  onSaveNotes,
}: AccordionProps) {
  const [currentNotes, setCurrentNotes] = useState(initialNotes);
  const { youtubeUrl, psthcUrl, steamGuidesUrl } = buildGuideUrls(gameName, achievementName, gameId);

  return (
    <div className="border-t border-edge/80 bg-ink/40 p-3 sm:p-4 space-y-3 rounded-b-2xl">
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-dust">
          Guides & Astuces :
        </span>
        <div className="mt-2 flex flex-wrap gap-2">
          <a
            href={youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl border border-danger/40 bg-danger/10 px-3 py-1.5 text-xs font-semibold text-danger transition hover:bg-danger/20"
          >
            <Video className="h-3.5 w-3.5" />
            Solution Vidéo (YouTube FR)
            <ExternalLink className="h-3 w-3 opacity-60" />
          </a>

          <a
            href={psthcUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl border border-done/40 bg-done/10 px-3 py-1.5 text-xs font-semibold text-done transition hover:bg-done/20"
          >
            <Trophy className="h-3.5 w-3.5" />
            Guide PSTHC
            <ExternalLink className="h-3 w-3 opacity-60" />
          </a>

          <a
            href={steamGuidesUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl border border-lamp/40 bg-lamp/10 px-3 py-1.5 text-xs font-semibold text-lamp-bright transition hover:bg-lamp/20"
          >
            <BookOpen className="h-3.5 w-3.5" />
            Guides Steam
            <ExternalLink className="h-3 w-3 opacity-60" />
          </a>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-dust">
            Mes notes personnelles :
          </span>
          <span className="text-[11px] text-faint">Sauvegardé auto</span>
        </div>
        <textarea
          value={currentNotes}
          onChange={(e) => {
            setCurrentNotes(e.target.value);
            onSaveNotes(e.target.value);
          }}
          placeholder="Ex: Obtenu au Chapitre 3 après avoir parlé au forgeron..."
          rows={2}
          className="mt-1.5 w-full rounded-xl border border-edge bg-plank/90 p-2 text-xs text-paper placeholder-seam outline-none transition focus:border-lamp"
        />
      </div>
    </div>
  );
}
