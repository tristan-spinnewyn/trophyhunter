// components/library/shelf/ShelfHeading.tsx

interface ShelfHeadingProps {
  readonly id: string;
  readonly title: string;
  readonly count: number;
  readonly dotClass?: string;
  readonly size?: "large" | "small";
}

export function ShelfHeading({ id, title, count, dotClass, size = "large" }: ShelfHeadingProps) {
  return (
    <span className="flex items-baseline gap-3">
      {dotClass && <span aria-hidden className={`h-2.5 w-2.5 shrink-0 self-center rounded-full ${dotClass}`} />}
      <h3
        id={id}
        className={`font-semiwide font-bold tracking-tight text-paper ${size === "large" ? "text-[26px]" : "text-xl"}`}
      >
        {title}
      </h3>
      <span className="tabular-nums text-dust">{count}</span>
    </span>
  );
}
