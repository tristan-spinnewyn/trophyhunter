// components/ui/textTab.ts

/** Text tabs, shared by the top bar and every tab strip: plain words, the active one underlined in lamp. */
export function textTabClassName(isActive: boolean): string {
  const base = "flex items-center gap-1.5 whitespace-nowrap py-1.5 text-[15px] transition";
  return isActive
    ? `${base} text-paper shadow-[inset_0_-2px_0_var(--lamp)]`
    : `${base} text-dust hover:text-paper`;
}
