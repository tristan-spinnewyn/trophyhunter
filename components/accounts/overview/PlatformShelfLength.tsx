// components/accounts/overview/PlatformShelfLength.tsx

import { shelfLengthBars } from "@/lib/library/shelf-length";

/** Irregular heights so the strip reads as boxes on a shelf, not as a bar chart. */
const SPINE_HEIGHTS = [22, 28, 24, 30, 21, 26, 29, 23, 27, 25];

interface PlatformShelfLengthProps {
  readonly count: number;
  readonly largestCount: number;
}

/** This platform's share of the collection, drawn as a length of shelf. Decorative: the count is written next to it. */
export function PlatformShelfLength({ count, largestCount }: PlatformShelfLengthProps) {
  const bars = shelfLengthBars(count, largestCount);
  if (bars === 0) return null;

  return (
    <div aria-hidden className="mt-3 inline-flex flex-col">
      <div className="flex h-[30px] items-end gap-[2px]">
        {Array.from({ length: bars }, (_, i) => (
          <span key={i} className="w-1.5 rounded-t-[1px] bg-dust/60" style={{ height: SPINE_HEIGHTS[i % SPINE_HEIGHTS.length] }} />
        ))}
      </div>
      <div className="h-1 bg-edge" />
    </div>
  );
}
