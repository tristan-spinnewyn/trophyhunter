// __tests__/lib/library/date-time.test.ts
import { describe, it, expect } from "vitest";
import { toTime } from "@/lib/library/date-time";

describe("toTime", () => {
  it("reads an ISO date as milliseconds", () => {
    expect(toTime("2026-11-01T10:00:00.000Z")).toBe(Date.parse("2026-11-01T10:00:00.000Z"));
  });

  it("gives null for a missing or unreadable date", () => {
    expect(toTime(undefined)).toBeNull();
    expect(toTime("soon")).toBeNull();
  });
});
