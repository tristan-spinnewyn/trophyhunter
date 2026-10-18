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
  it("exposes backlog as default and defines all three valid statuses", () => {
    expect(DEFAULT_GAME_STATUS).toBe("backlog");
    expect(VALID_GAME_STATUSES).toEqual(["backlog", "in-progress", "completed"]);
    expect(GAME_STATUS_OPTIONS).toHaveLength(3);
    expect(GAME_STATUS_META.backlog.label).toBe("Backlog");
    expect(GAME_STATUS_META["in-progress"].label).toBe("En cours");
    expect(GAME_STATUS_META.completed.label).toBe("Terminé");
  });

  it("validates game status values strictly including null, undefined and non-strings", () => {
    expect(isValidGameStatus("backlog")).toBe(true);
    expect(isValidGameStatus("in-progress")).toBe(true);
    expect(isValidGameStatus("completed")).toBe(true);

    expect(isValidGameStatus(undefined)).toBe(false);
    expect(isValidGameStatus(null)).toBe(false);
    expect(isValidGameStatus("")).toBe(false);
    expect(isValidGameStatus("abandoned")).toBe(false);
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
