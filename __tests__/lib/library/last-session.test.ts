// __tests__/lib/library/last-session.test.ts
import { describe, it, expect } from "vitest";
import { formatElapsed, formatLastSession } from "@/lib/library/last-session";

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

describe("formatElapsed", () => {
  const now = new Date("2026-11-11T12:00:00.000Z");
  const daysAgo = (days: number) => new Date(now.getTime() - days * 86_400_000).toISOString();

  it("counts weeks under two months, then months, then years", () => {
    expect(formatElapsed(daysAgo(10), now)).toBe("1 semaine");
    expect(formatElapsed(daysAgo(45), now)).toBe("6 semaines");
    expect(formatElapsed(daysAgo(102), now)).toBe("3 mois");
    expect(formatElapsed(daysAgo(800), now)).toBe("2 ans");
    expect(formatElapsed(daysAgo(400), now)).toBe("1 an");
  });

  it("gives null for a missing or unreadable date", () => {
    expect(formatElapsed(undefined, now)).toBeNull();
    expect(formatElapsed("soon", now)).toBeNull();
  });
});
