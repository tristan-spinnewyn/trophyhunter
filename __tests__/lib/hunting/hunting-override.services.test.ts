// __tests__/lib/hunting/hunting-override.services.test.ts

import { describe, it, expect } from "vitest";
import {
  validateHuntingOverride,
  sanitizeHuntingOverrideSafe,
  getDefaultWarningMessageForType,
} from "@/lib/hunting/hunting-override.services";
import { InvalidHuntingMetaError } from "@/lib/hunting/hunting.types";

describe("hunting-override.services", () => {
  it("validates valid hunting overrides and ignores non-object inputs", () => {
    expect(validateHuntingOverride(null)).toEqual({});
    expect(validateHuntingOverride([])).toEqual({});

    const valid = validateHuntingOverride({
      difficultyRating: 7.4,
      estimatedHours: 45,
      minPlaythroughs: 2,
      warningType: "unobtainable",
      warningMessage: "  Serveurs hors ligne  ",
    });

    expect(valid).toEqual({
      difficultyRating: 7,
      estimatedHours: 45,
      minPlaythroughs: 2,
      warningType: "unobtainable",
      warningMessage: "Serveurs hors ligne",
    });
  });

  it("throws InvalidHuntingMetaError on out-of-range fields", () => {
    expect(() => validateHuntingOverride({ difficultyRating: 0 })).toThrow(
      InvalidHuntingMetaError
    );
    expect(() => validateHuntingOverride({ difficultyRating: 11 })).toThrow(
      InvalidHuntingMetaError
    );
    expect(() => validateHuntingOverride({ estimatedHours: -5 })).toThrow(
      InvalidHuntingMetaError
    );
    expect(() => validateHuntingOverride({ minPlaythroughs: 25 })).toThrow(
      InvalidHuntingMetaError
    );
    expect(() => validateHuntingOverride({ warningType: "invalid-type" })).toThrow(
      InvalidHuntingMetaError
    );
  });

  it("safely sanitizes overrides returning undefined on invalid or empty input", () => {
    expect(sanitizeHuntingOverrideSafe(null)).toBeUndefined();
    expect(sanitizeHuntingOverrideSafe({})).toBeUndefined();
    expect(sanitizeHuntingOverrideSafe({ difficultyRating: 99 })).toBeUndefined();
    expect(sanitizeHuntingOverrideSafe({ difficultyRating: 8 })).toEqual({
      difficultyRating: 8,
    });
  });

  it("returns default French warning messages by warning type", () => {
    expect(getDefaultWarningMessageForType("none")).toBeNull();
    expect(getDefaultWarningMessageForType("unobtainable")).toContain("inobtenable");
    expect(getDefaultWarningMessageForType("bugged")).toContain("buggés");
    expect(getDefaultWarningMessageForType("online-required")).toContain("multijoueur");
  });
});
