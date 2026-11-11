// __tests__/lib/library/duration-label.test.ts
import { describe, it, expect } from "vitest";
import { describeDurations, shortDurationLabel } from "@/lib/library/duration-label";

const HOUR = 3600;

describe("shortDurationLabel", () => {
  it("rounds the usual playthrough to the hour", () => {
    expect(shortDurationLabel({ hastilySeconds: 8 * HOUR, normallySeconds: 11.6 * HOUR, completelySeconds: null })).toBe("12 h");
  });

  it("falls back on the quickest, then the full playthrough", () => {
    expect(shortDurationLabel({ hastilySeconds: 5 * HOUR, normallySeconds: null, completelySeconds: 40 * HOUR })).toBe("5 h");
    expect(shortDurationLabel({ hastilySeconds: null, normallySeconds: null, completelySeconds: 40 * HOUR })).toBe("40 h");
  });

  it("says when a game is shorter than an hour", () => {
    expect(shortDurationLabel({ hastilySeconds: null, normallySeconds: 1200, completelySeconds: null })).toBe("< 1 h");
  });

  it("has no label without any duration", () => {
    expect(shortDurationLabel(undefined)).toBeNull();
    expect(shortDurationLabel({ hastilySeconds: null, normallySeconds: null, completelySeconds: null })).toBeNull();
  });
});

describe("describeDurations", () => {
  it("spells out each known playthrough", () => {
    expect(describeDurations({ hastilySeconds: 8 * HOUR, normallySeconds: 12 * HOUR, completelySeconds: 40 * HOUR })).toBe(
      "Environ 12 h · histoire seule 8 h · à 100 % 40 h"
    );
  });

  it("leaves out the unknown ones", () => {
    expect(describeDurations({ hastilySeconds: 8 * HOUR, normallySeconds: null, completelySeconds: null })).toBe("Histoire seule 8 h");
  });

  it("has nothing to say without any duration", () => {
    expect(describeDurations(undefined)).toBeNull();
  });
});
