// components/library/triage/triageSummary.ts

const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;

/** "2 jeux triés, 1 passé." once the pile has been gone through. */
export function describeTriageSession(sortedCount: number, skippedCount: number): string {
  const parts = [
    sortedCount > 0 ? plural(sortedCount, "jeu trié", "jeux triés") : null,
    skippedCount > 0 ? plural(skippedCount, "passé", "passés") : null,
  ].filter(Boolean);

  return parts.length > 0 ? `${parts.join(", ")}.` : "Rien à trier.";
}
