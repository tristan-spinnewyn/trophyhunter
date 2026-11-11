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
  it("exposes unsorted as default and defines the seven tracking statuses in display order", () => {
    expect(DEFAULT_GAME_STATUS).toBe("unsorted");
    expect(VALID_GAME_STATUSES).toEqual(["unsorted", "backlog", "in-progress", "paused", "completed", "abandoned", "not-interested"]);
    expect(GAME_STATUS_OPTIONS.map((o) => o.value)).toEqual(VALID_GAME_STATUSES);
    expect(GAME_STATUS_META.unsorted.label).toBe("Non trié");
    expect(GAME_STATUS_META.backlog.label).toBe("Backlog");
    expect(GAME_STATUS_META["in-progress"].label).toBe("En cours");
    expect(GAME_STATUS_META.paused.label).toBe("En pause");
    expect(GAME_STATUS_META.completed.label).toBe("Terminé");
    expect(GAME_STATUS_META.abandoned.label).toBe("Abandonné");
    expect(GAME_STATUS_META["not-interested"].label).toBe("Pas intéressé");
  });

  it("gives every status a plural section title for the library", () => {
    expect(GAME_STATUS_META.unsorted.sectionTitle).toBe("Non triés");
    expect(GAME_STATUS_META.backlog.sectionTitle).toBe("Backlog");
    expect(GAME_STATUS_META["in-progress"].sectionTitle).toBe("En cours");
    expect(GAME_STATUS_META.paused.sectionTitle).toBe("En pause");
    expect(GAME_STATUS_META.completed.sectionTitle).toBe("Terminés");
    expect(GAME_STATUS_META.abandoned.sectionTitle).toBe("Abandonnés");
    expect(GAME_STATUS_META["not-interested"].sectionTitle).toBe("Pas intéressés");
  });

  it("validates game status values strictly including null, undefined and non-strings", () => {
    expect(isValidGameStatus("unsorted")).toBe(true);
    expect(isValidGameStatus("backlog")).toBe(true);
    expect(isValidGameStatus("in-progress")).toBe(true);
    expect(isValidGameStatus("completed")).toBe(true);
    expect(isValidGameStatus("paused")).toBe(true);
    expect(isValidGameStatus("abandoned")).toBe(true);
    expect(isValidGameStatus("not-interested")).toBe(true);

    expect(isValidGameStatus(undefined)).toBe(false);
    expect(isValidGameStatus(null)).toBe(false);
    expect(isValidGameStatus("")).toBe(false);
    expect(isValidGameStatus("dropped")).toBe(false);
    expect(isValidGameStatus(123)).toBe(false);
    expect(isValidGameStatus({})).toBe(false);
  });

  it("resolves invalid or missing statuses to the unsorted default, never to the backlog", () => {
    expect(resolveGameStatus("completed")).toBe("completed");
    expect(resolveGameStatus("in-progress")).toBe("in-progress");
    expect(resolveGameStatus("backlog")).toBe("backlog");
    expect(resolveGameStatus(undefined)).toBe("unsorted");
    expect(resolveGameStatus(null)).toBe("unsorted");
    expect(resolveGameStatus("unknown-status")).toBe("unsorted");
  });

  it.each([
    ["unsorted", "dust"],
    ["backlog", "queued"],
    ["in-progress", "lamp"],
    ["paused", "paused"],
    ["completed", "done"],
    ["abandoned", "dropped"],
  ] as const)("colours the %s status with its own %s token everywhere", (status, token) => {
    expect(GAME_STATUS_META[status].dotClass).toBe(`bg-${token}`);
    if (status !== "unsorted") expect(GAME_STATUS_META[status].badgeClass).toContain(`border-${token}`);
  });

  it("throws InvalidGameStatusError when asserting an invalid status", () => {
    expect(assertValidGameStatus("completed")).toBe("completed");
    expect(() => assertValidGameStatus("invalid")).toThrow(InvalidGameStatusError);
    expect(() => assertValidGameStatus(null)).toThrow(InvalidGameStatusError);
  });
});
