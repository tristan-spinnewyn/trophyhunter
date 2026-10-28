// __tests__/lib/library/last-session.test.ts
import { describe, it, expect } from "vitest";
import { formatLastSession } from "@/lib/library/last-session";

const NOW = new Date("2026-10-28T15:00:00.000Z");
const daysAgo = (days: number) => new Date(NOW.getTime() - days * 86_400_000).toISOString();

describe("formatLastSession", () => {
  it("returns null when the game was never played", () => {
    expect(formatLastSession(undefined, NOW)).toBeNull();
    expect(formatLastSession("not a date", NOW)).toBeNull();
  });

  it("says today and yesterday in words", () => {
    expect(formatLastSession(daysAgo(0), NOW)).toBe("aujourd’hui");
    expect(formatLastSession(daysAgo(1), NOW)).toBe("hier");
  });

  it("counts days during the first week", () => {
    expect(formatLastSession(daysAgo(3), NOW)).toBe("il y a 3 jours");
    expect(formatLastSession(daysAgo(6), NOW)).toBe("il y a 6 jours");
  });

  it("counts weeks, then months, then years", () => {
    expect(formatLastSession(daysAgo(14), NOW)).toBe("il y a 2 semaines");
    expect(formatLastSession(daysAgo(150), NOW)).toBe("il y a 5 mois");
    expect(formatLastSession(daysAgo(800), NOW)).toBe("il y a 2 ans");
  });

  it("treats a date slightly in the future (clock skew) as today", () => {
    expect(formatLastSession(new Date(NOW.getTime() + 60_000).toISOString(), NOW)).toBe("aujourd’hui");
  });
});
