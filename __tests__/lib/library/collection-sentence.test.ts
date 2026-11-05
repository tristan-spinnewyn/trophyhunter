import { describe, it, expect } from "vitest";
import { describeCollection } from "@/lib/library/collection-sentence";
import type { TrackingSummary } from "@/lib/library/library-tracking";

const summary = (overrides: Partial<TrackingSummary> = {}): TrackingSummary => ({
  countByStatus: { backlog: 42, "in-progress": 3, paused: 0, completed: 5, abandoned: 1 },
  totalHours: 1382,
  unlockedAchievements: 0,
  perfectGames: 0,
  ...overrides,
});

describe("describeCollection", () => {
  it("states the size, the hours, and what is being played and waiting", () => {
    expect(describeCollection(214, summary())).toEqual({
      size: "214 jeux",
      hours: "1 382 heures", // narrow no-break space, as French typography wants
      queue: "3 en cours, 42 à jouer.",
    });
  });

  it("uses the singular for one game and one hour", () => {
    const s = describeCollection(1, summary({ totalHours: 1 }));
    expect(s.size).toBe("1 jeu");
    expect(s.hours).toBe("1 heure");
  });

  it("leaves out the hours when none were recorded", () => {
    expect(describeCollection(4, summary({ totalHours: 0 })).hours).toBeNull();
  });

  it("only mentions the non-empty parts of the queue", () => {
    const none = { backlog: 0, "in-progress": 0, paused: 0, completed: 2, abandoned: 0 };
    expect(describeCollection(2, summary({ countByStatus: none })).queue).toBeNull();
    expect(describeCollection(2, summary({ countByStatus: { ...none, backlog: 2 } })).queue).toBe("2 à jouer.");
    expect(describeCollection(2, summary({ countByStatus: { ...none, "in-progress": 1 } })).queue).toBe("1 en cours.");
  });
});
