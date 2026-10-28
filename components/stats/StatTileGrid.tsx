// components/stats/StatTileGrid.tsx

import type { LucideIcon } from "lucide-react";

export interface StatTile {
  readonly label: string;
  readonly value: string | number;
  readonly icon: LucideIcon;
  readonly iconClass: string;
  /** Small inline figure next to the value (e.g. "3/6"). */
  readonly detail?: string;
  /** One-line explanation under the value. */
  readonly hint?: string;
}

const GRID_COLUMNS: Record<number, string> = {
  4: "lg:grid-cols-4",
  5: "sm:grid-cols-3 lg:grid-cols-5",
};

export function StatTileGrid({ tiles }: { readonly tiles: readonly StatTile[] }) {
  return (
    <dl className={`grid grid-cols-2 gap-2 sm:gap-3 ${GRID_COLUMNS[tiles.length] ?? "lg:grid-cols-4"}`}>
      {tiles.map(({ label, value, detail, hint, icon: Icon, iconClass }) => (
        <div key={label} className="rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-3">
          <dt className="flex items-center gap-1.5 text-xs text-slate-400">
            <Icon className={`h-3.5 w-3.5 shrink-0 ${iconClass}`} aria-hidden />
            {label}
          </dt>
          <dd className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-semibold tabular-nums text-white">{value}</span>
            {detail && <span className="text-xs tabular-nums text-slate-500">{detail}</span>}
          </dd>
          {hint && <dd className="mt-0.5 truncate text-xs text-slate-500">{hint}</dd>}
        </div>
      ))}
    </dl>
  );
}
