// __tests__/lib/game-status/game-status.services.test.ts
import { describe, it, expect } from "vitest";
import {
  DEFAULT_GAME_STATUS,
  VALID_GAME_STATUSES,
  GAME_STATUS_OPTIONS,
  GAME_STATUS_META,
  isValidGameStatus,
  resolveGameStatus,
  assertValidGameStatus,
} from "@/lib/game-status/game-status.services";
import { InvalidGameStatusError } from "@/lib/game-status/game-status.types";

describe("game-status.services", () => {
  it("exposes backlog as default and defines the five tracking statuses in display order", () => {
    expect(DEFAULT_GAME_STATUS).toBe("backlog");
    expect(VALID_GAME_STATUSES).toEqual(["backlog", "in-progress", "paused", "completed", "abandoned"]);
    expect(GAME_STATUS_OPTIONS.map((o) => o.value)).toEqual(VALID_GAME_STATUSES);
    expect(GAME_STATUS_META.backlog.label).toBe("À jouer");
    expect(GAME_STATUS_META["in-progress"].label).toBe("En cours");
    expect(GAME_STATUS_META.paused.label).toBe("En pause");
    expect(GAME_STATUS_META.completed.label).toBe("Terminé");
    expect(GAME_STATUS_META.abandoned.label).toBe("Abandonné");
  });

  it("gives every status a plural section title for the library", () => {
    expect(GAME_STATUS_META.backlog.sectionTitle).toBe("À jouer");
    expect(GAME_STATUS_META["in-progress"].sectionTitle).toBe("En cours");
    expect(GAME_STATUS_META.paused.sectionTitle).toBe("En pause");
    expect(GAME_STATUS_META.completed.sectionTitle).toBe("Terminés");
    expect(GAME_STATUS_META.abandoned.sectionTitle).toBe("Abandonnés");
  });

  it("validates game status values strictly including null, undefined and non-strings", () => {
    expect(isValidGameStatus("backlog")).toBe(true);
    expect(isValidGameStatus("in-progress")).toBe(true);
    expect(isValidGameStatus("completed")).toBe(true);
    expect(isValidGameStatus("paused")).toBe(true);
    expect(isValidGameStatus("abandoned")).toBe(true);

    expect(isValidGameStatus(undefined)).toBe(false);
    expect(isValidGameStatus(null)).toBe(false);
    expect(isValidGameStatus("")).toBe(false);
    expect(isValidGameStatus("dropped")).toBe(false);
    expect(isValidGameStatus(123)).toBe(false);
    expect(isValidGameStatus({})).toBe(false);
  });

  it("resolves invalid or missing statuses to backlog default", () => {
    expect(resolveGameStatus("completed")).toBe("completed");
    expect(resolveGameStatus("in-progress")).toBe("in-progress");
    expect(resolveGameStatus("backlog")).toBe("backlog");
    expect(resolveGameStatus(undefined)).toBe("backlog");
    expect(resolveGameStatus(null)).toBe("backlog");
    expect(resolveGameStatus("unknown-status")).toBe("backlog");
  });

  it("throws InvalidGameStatusError when asserting an invalid status", () => {
    expect(assertValidGameStatus("completed")).toBe("completed");
    expect(() => assertValidGameStatus("invalid")).toThrow(InvalidGameStatusError);
    expect(() => assertValidGameStatus(null)).toThrow(InvalidGameStatusError);
  });
});
