// components/accounts/PlatformCollectionLink.tsx

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { PlatformType } from "@/lib/types";
import { PLATFORM_META } from "@/lib/platforms";

interface PlatformCollectionLinkProps {
  readonly platform: PlatformType;
  readonly gameCount: number;
}

/** Bridges a platform's connection panel to the matching slice of the collection. */
export function PlatformCollectionLink({ platform, gameCount }: PlatformCollectionLinkProps) {
  const { name } = PLATFORM_META[platform];

  if (gameCount === 0) {
    return <p className="text-sm text-slate-500">Aucun jeu {name} dans ta collection pour l&apos;instant.</p>;
  }

  return (
    <Link
      href={`/?tab=${platform}`}
      className="inline-flex items-center gap-1 text-sm font-medium text-sky-400 hover:text-sky-300"
    >
      Voir mes {gameCount} {gameCount > 1 ? "jeux" : "jeu"} {name} dans ma collection
      <ChevronRight className="h-4 w-4" />
    </Link>
  );
}
