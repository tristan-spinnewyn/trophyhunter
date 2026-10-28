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
    <div className="border-t border-slate-800/80 bg-slate-950/40 p-3 sm:p-4 space-y-3 rounded-b-2xl">
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Guides & Astuces :
        </span>
        <div className="mt-2 flex flex-wrap gap-2">
          <a
            href={youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20"
          >
            <Video className="h-3.5 w-3.5" />
            Solution Vidéo (YouTube FR)
            <ExternalLink className="h-3 w-3 opacity-60" />
          </a>

          <a
            href={psthcUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
          >
            <Trophy className="h-3.5 w-3.5" />
            Guide PSTHC
            <ExternalLink className="h-3 w-3 opacity-60" />
          </a>

          <a
            href={steamGuidesUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-300 transition hover:bg-sky-500/20"
          >
            <BookOpen className="h-3.5 w-3.5" />
            Guides Steam
            <ExternalLink className="h-3 w-3 opacity-60" />
          </a>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Mes notes personnelles :
          </span>
          <span className="text-[11px] text-slate-500">Sauvegardé auto</span>
        </div>
        <textarea
          value={currentNotes}
          onChange={(e) => {
            setCurrentNotes(e.target.value);
            onSaveNotes(e.target.value);
          }}
          placeholder="Ex: Obtenu au Chapitre 3 après avoir parlé au forgeron..."
          rows={2}
          className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-900/90 p-2 text-xs text-slate-200 placeholder-slate-600 outline-none transition focus:border-sky-500"
        />
      </div>
    </div>
  );
}
