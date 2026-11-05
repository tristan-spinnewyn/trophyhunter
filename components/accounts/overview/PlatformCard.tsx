// components/accounts/overview/PlatformCard.tsx

import type { PlatformType, PlatformAccount } from "@/lib/types";
import { PLATFORM_META } from "@/lib/platforms";
import { PlatformCardStats } from "./PlatformCardStats";
import { PlatformCardActions } from "./PlatformCardActions";
import { PlatformShelfLength } from "./PlatformShelfLength";

interface PlatformCardProps {
  platform: PlatformType;
  account?: PlatformAccount;
  count: number;
  /** Game count of the largest platform, to size this platform's shelf. */
  largestCount: number;
  onSelectPlatform: (platform: PlatformType) => void;
  onEditPlatform: (platform: PlatformType) => void;
  onDisconnectPlatform: (platform: PlatformType) => void;
}

/** One store per row: its name, who it is linked to, its share of the collection, and what to do with it. */
export function PlatformCard({
  platform: plat,
  account: acc,
  count,
  largestCount,
  onSelectPlatform,
  onEditPlatform,
  onDisconnectPlatform,
}: PlatformCardProps) {
  const meta = PLATFORM_META[plat];
  const games = `${count} ${count > 1 ? "jeux" : "jeu"}`;

  return (
    <li className="grid grid-cols-[1fr_auto] items-center gap-x-7 gap-y-3 border-b border-edge py-6 md:grid-cols-[180px_1fr_auto]">
      <h3 className={`font-wide text-[26px] font-extrabold leading-none tracking-[-0.02em] md:text-3xl ${acc ? "text-paper" : "text-dust"}`}>
        {meta.shortName}
      </h3>

      <div className="col-span-2 row-start-2 min-w-0 md:col-span-1 md:col-start-2 md:row-start-1">
        {acc ? (
          <>
            <p className="text-[15px] text-paper">
              Lié à <strong className="font-semibold">{acc.displayName}</strong>
              {acc.level ? <span className="ml-2 text-sm tabular-nums text-dust">Niv. {acc.level}</span> : null}
            </p>
            <p className="text-sm tabular-nums text-dust">{games}</p>
            <PlatformCardStats account={acc} meta={meta} />
          </>
        ) : (
          <p className="text-[15px] text-dust">
            Pas encore lié. Lie ton compte {meta.name} pour importer tes jeux et tes succès.
            {count > 0 && <span className="block text-sm tabular-nums">{games} ajoutés à la main</span>}
          </p>
        )}
        <PlatformShelfLength count={count} largestCount={largestCount} />
      </div>

      <PlatformCardActions
        platform={plat}
        account={acc}
        onSelectPlatform={onSelectPlatform}
        onEditPlatform={onEditPlatform}
        onDisconnectPlatform={onDisconnectPlatform}
      />
    </li>
  );
}
