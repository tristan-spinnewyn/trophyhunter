// components/library/FeaturedGamesSection.tsx

"use client";

import { useRouter } from "next/navigation";
import { Flame, ShieldCheck } from "lucide-react";
import type { OwnedGame } from "@/lib/types";
import { FEATURED_GAMES } from "./featuredGames.data";

export { FEATURED_GAMES };

interface FeaturedGamesSectionProps {
  ownedGames: OwnedGame[];
}

export function FeaturedGamesSection({ ownedGames }: FeaturedGamesSectionProps) {
  const router = useRouter();

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white">
            Jeux Populaires & Chasses Recommandées
          </h3>
        </div>
        <span className="text-[11px] text-slate-500">
          Cliquez pour explorer les succès
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5">
        {FEATURED_GAMES.map((game) => {
          const isOwned = ownedGames.some((g) => g.appId === game.id);
          return (
            <button
              key={game.id}
              onClick={() => router.push(`/game/${game.id}`)}
              className="group relative flex flex-col items-center overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60 p-1.5 transition-all hover:border-sky-500/50 hover:bg-slate-900 hover:shadow-lg hover:shadow-sky-500/10 text-left"
            >
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-slate-900">
                <img
                  src={game.img}
                  alt={game.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {isOwned && (
                  <div className="absolute top-1 right-1 flex items-center justify-center rounded-md bg-emerald-500/90 p-0.5 shadow">
                    <ShieldCheck className="h-3 w-3 text-slate-950" />
                  </div>
                )}
              </div>
              <div className="w-full px-1 pt-1.5 pb-0.5">
                <div className="text-[11px] font-bold text-slate-200 truncate group-hover:text-sky-300">
                  {game.name}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  {game.count}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
