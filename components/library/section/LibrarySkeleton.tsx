// components/library/section/LibrarySkeleton.tsx

const PLACEHOLDER_CARDS = 6;

/** Placeholder cards while the collection loads, so the empty state never flashes. */
export function LibrarySkeleton() {
  return (
    <div role="status" aria-label="Chargement de ta collection" className="space-y-3">
      <div className="h-5 w-28 animate-pulse rounded bg-slate-800" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: PLACEHOLDER_CARDS }, (_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60">
            <div className="aspect-[460/215] w-full animate-pulse bg-slate-800/80" />
            <div className="space-y-2 p-3">
              <div className="h-4 w-2/3 animate-pulse rounded bg-slate-800" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-slate-800/70" />
              <div className="h-8 w-24 animate-pulse rounded-md bg-slate-800/70" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
