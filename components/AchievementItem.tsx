"use client";

import { useState, useEffect } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Eye,
  Video,
  BookOpen,
  Trophy,
  ExternalLink,
  Edit3,
} from "lucide-react";
import type { Achievement } from "@/lib/types";

interface AchievementItemProps {
  achievement: Achievement;
  gameName: string;
  gameId: number;
  isUnlocked: boolean;
  notes: string;
  revealSecret: boolean;
  onToggleUnlocked: () => void;
  onSaveNotes: (notes: string) => void;
}

export default function AchievementItem({
  achievement,
  gameName,
  gameId,
  isUnlocked,
  notes,
  revealSecret,
  onToggleUnlocked,
  onSaveNotes,
}: AchievementItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentNotes, setCurrentNotes] = useState(notes || "");

  useEffect(() => {
    setCurrentNotes(notes || "");
  }, [notes]);

  // Rarity color and label
  const getRarityBadge = (percent: number) => {
    if (percent <= 5.0) {
      return {
        label: "Ultra Rare",
        classes: "border-amber-400/40 bg-amber-500/10 text-amber-300",
      };
    }
    if (percent <= 20.0) {
      return {
        label: "Très Rare",
        classes: "border-purple-400/40 bg-purple-500/10 text-purple-300",
      };
    }
    if (percent <= 50.0) {
      return {
        label: "Rare",
        classes: "border-sky-400/40 bg-sky-500/10 text-sky-300",
      };
    }
    return {
      label: "Commun",
      classes: "border-slate-700 bg-slate-800 text-slate-400",
    };
  };

  const rarity = getRarityBadge(achievement.percent);

  // Hidden description logic
  const isSecret = achievement.hidden;
  const descriptionText =
    isSecret && !revealSecret && !isUnlocked
      ? "Succès masqué. Clique sur 'Révéler les secrets' pour afficher les détails."
      : achievement.desc;

  // External guide query urls
  const cleanQuery = encodeURIComponent(
    `${gameName} ${achievement.name} succès trophée guide fr`
  );
  const youtubeUrl = `https://www.youtube.com/results?search_query=${cleanQuery}`;
  const psthcUrl = `https://www.psthc.fr/recherche.html?q=${encodeURIComponent(
    gameName
  )}`;
  const steamGuidesUrl = `https://steamcommunity.com/app/${gameId}/guides/?requiredtags[]=Achievements`;

  return (
    <div
      className={`group rounded-2xl border transition-all duration-200 ${
        isUnlocked
          ? "border-emerald-500/40 bg-emerald-950/20 shadow-sm"
          : "border-slate-800/90 bg-slate-900/70 hover:border-slate-700"
      }`}
    >
      {/* Main Row */}
      <div className="flex items-center gap-3 p-3 sm:p-4">
        {/* Checkbox Touch Target */}
        <button
          onClick={onToggleUnlocked}
          title={isUnlocked ? "Marquer comme non obtenu" : "Marquer comme obtenu"}
          className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl border transition active:scale-90 ${
            isUnlocked
              ? "border-emerald-500 bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30"
              : "border-slate-700 bg-slate-800/80 text-transparent hover:border-slate-600 hover:text-slate-500"
          }`}
        >
          <Check className="h-4 w-4 sm:h-5 sm:w-5 stroke-[3]" />
        </button>

        {/* Achievement Icon */}
        <div className="relative shrink-0">
          <img
            src={achievement.icon}
            alt={achievement.name}
            className={`h-12 w-12 sm:h-14 sm:w-14 rounded-xl object-cover border transition ${
              isUnlocked
                ? "border-emerald-500/60 shadow-md shadow-emerald-500/10"
                : "border-slate-800 grayscale-[40%] opacity-80"
            }`}
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
          {isUnlocked && (
            <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-slate-950 font-bold">
              ✓
            </div>
          )}
        </div>

        {/* Content (Name, Description, Badges) */}
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex flex-wrap items-center gap-1.5">
            <h3
              className={`text-sm sm:text-base font-bold tracking-tight ${
                isUnlocked ? "text-emerald-300" : "text-white"
              }`}
            >
              {achievement.name}
            </h3>

            {/* Badges */}
            <span
              className={`rounded-md border px-1.5 py-0.2 text-[10px] font-semibold ${rarity.classes}`}
            >
              {achievement.percent}% • {rarity.label}
            </span>

            {achievement.missable && (
              <span className="flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.2 text-[10px] font-semibold text-amber-300">
                <AlertTriangle className="h-2.5 w-2.5" />
                Manquable
              </span>
            )}

            {isSecret && (
              <span className="flex items-center gap-1 rounded-md border border-purple-500/40 bg-purple-500/10 px-1.5 py-0.2 text-[10px] font-semibold text-purple-300">
                <Eye className="h-2.5 w-2.5" />
                Secret
              </span>
            )}

            {notes && (
              <span className="flex items-center gap-1 rounded-md border border-sky-500/40 bg-sky-500/10 px-1.5 py-0.2 text-[10px] font-semibold text-sky-300">
                <Edit3 className="h-2.5 w-2.5" />
                Note
              </span>
            )}
          </div>

          <p
            className={`mt-1 text-xs leading-relaxed ${
              isSecret && !revealSecret && !isUnlocked
                ? "italic text-slate-500"
                : "text-slate-300"
            }`}
          >
            {descriptionText}
          </p>
        </div>

        {/* Chevron Expand Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-800 hover:text-white"
          title={isExpanded ? "Réduire" : "Voir le guide & notes"}
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Expanded Accordion: Guides, Links & Notes */}
      {isExpanded && (
        <div className="border-t border-slate-800/80 bg-slate-950/40 p-3 sm:p-4 space-y-3 rounded-b-2xl">
          {/* Quick External Guides */}
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

          {/* Personal Notes Editor */}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Mes notes personnelles :
              </span>
              <span className="text-[10px] text-slate-500">Sauvegardé auto</span>
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
      )}
    </div>
  );
}
