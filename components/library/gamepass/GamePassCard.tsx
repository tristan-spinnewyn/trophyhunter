// components/library/gamepass/GamePassCard.tsx

import { Trophy, Heart, Plus, Check, ExternalLink } from "lucide-react";
import type { GamePassCatalogItem } from "@/lib/gamepass/gamepass.types";
import type { PlatformType } from "@/lib/types";

interface GamePassCardProps {
  readonly item: GamePassCatalogItem;
  readonly isOwned: boolean;
  readonly isWishlisted: boolean;
  readonly onAddGameToXbox: (item: GamePassCatalogItem) => Promise<void>;
  readonly onToggleWishlist: (appId: number, platform: PlatformType) => Promise<void>;
  readonly onSelectGame: (appId: number, name: string) => void;
}

export function GamePassCard({
  item, isOwned, isWishlisted, onAddGameToXbox, onToggleWishlist, onSelectGame,
}: GamePassCardProps) {
  return (
    <div className="group flex flex-col justify-between rounded-sheet border border-edge/90 bg-ink/80 overflow-hidden transition hover:border-done/50">
      <div>
        <div
          onClick={() => onSelectGame(item.appId, item.name)}
          className="relative h-36 w-full bg-plank overflow-hidden cursor-pointer"
        >
          {item.headerImg ? (
            <img
              src={item.headerImg}
              alt={item.name}
              loading="lazy"
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-faint font-bold">
              PC Game Pass
            </div>
          )}
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            <span className="rounded-control bg-done/90 border border-done/40 px-2 py-0.5 text-[11px] font-bold text-done">
              {item.category}
            </span>
            {item.hasXboxAchievements && (
              <span className="flex items-center gap-1 rounded-control bg-lamp/90 border border-lamp/40 px-1.5 py-0.5 text-[11px] font-bold text-lamp-bright">
                <Trophy className="h-2.5 w-2.5" />
                Succès
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              void onToggleWishlist(item.appId, "xbox");
            }}
            title={isWishlisted ? "Retirer de la liste d'envies" : "Ajouter à la liste d'envies"}
            className={`absolute top-2 right-2 rounded-full p-1.5 transition ${
              isWishlisted
                ? "bg-danger text-paper shadow-md"
                : "bg-ink/80 text-paper-dim hover:bg-danger/20 hover:text-danger"
            }`}
          >
            <Heart className={`h-3.5 w-3.5 ${isWishlisted ? "fill-current" : ""}`} />
          </button>
        </div>

        <div className="p-3.5 space-y-1.5">
          <h4
            onClick={() => onSelectGame(item.appId, item.name)}
            className="text-sm font-bold text-paper line-clamp-1 cursor-pointer hover:text-done transition"
          >
            {item.name}
          </h4>
          <p className="text-[11px] text-dust line-clamp-1">{item.developer}</p>
          {item.shortDescription && (
            <p className="text-[11px] text-faint line-clamp-2 leading-relaxed">{item.shortDescription}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-plank px-3.5 py-2.5 bg-ink/50">
        {isOwned ? (
          <button
            type="button"
            onClick={() => onSelectGame(item.appId, item.name)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-control border border-done/40 bg-done/15 py-1.5 text-xs font-bold text-done transition hover:bg-done/25"
          >
            <Check className="h-3.5 w-3.5" />
            <span>Dans ma bibliothèque</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void onAddGameToXbox(item)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-control bg-done py-1.5 text-xs font-bold text-ink transition hover:bg-done"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Ajouter (Xbox/PC)</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => onSelectGame(item.appId, item.name)}
          title="Voir les succès"
          className="rounded-control border border-edge bg-plank p-1.5 text-paper-dim transition hover:border-seam hover:text-paper"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
