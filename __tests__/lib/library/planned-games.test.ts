// __tests__/lib/library/planned-games.test.ts
import { describe, it, expect } from "vitest";
import { isPlannedGame } from "@/lib/library/planned-games";

describe("isPlannedGame", () => {
  it("counts the backlog and the games being played or paused", () => {
    expect(["backlog", "in-progress", "paused"].map((status) => isPlannedGame({ status: status as never }))).toEqual([true, true, true]);
  });

  it("leaves out the games unsorted, behind you or set aside for good", () => {
    expect(["unsorted", "completed", "abandoned", "not-interested"].map((status) => isPlannedGame({ status: status as never }))).toEqual([false, false, false, false]);
    expect(isPlannedGame({ status: undefined })).toBe(false);
  });
});
