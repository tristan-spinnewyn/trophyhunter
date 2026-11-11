// __tests__/lib/library/completion-date.test.ts
import { describe, it, expect } from "vitest";
import { completionDateFromInput, completionDateToInput } from "@/lib/library/completion-date";

const NOW = new Date("2026-11-11T09:00:00.000Z");

describe("completionDateToInput", () => {
  it("shows a stored finish date as a calendar day", () => {
    expect(completionDateToInput("2025-07-01T12:00:00.000Z")).toBe("2025-07-01");
  });

  it("is empty when the date is unknown or unreadable", () => {
    expect(completionDateToInput(undefined)).toBe("");
    expect(completionDateToInput("not a date")).toBe("");
  });
});

describe("completionDateFromInput", () => {
  it("stores a picked day at midday UTC, so its year never shifts with the time zone", () => {
    expect(completionDateFromInput("2024-12-31", NOW)).toBe("2024-12-31T12:00:00.000Z");
  });

  it("accepts today", () => {
    expect(completionDateFromInput("2026-11-11", NOW)).toBe("2026-11-11T12:00:00.000Z");
  });

  it("refuses a day in the future", () => {
    expect(completionDateFromInput("2026-11-12", NOW)).toBeNull();
  });

  it("refuses a day before video games, such as a year still being typed", () => {
    expect(completionDateFromInput("0202-08-14", NOW)).toBeNull();
    expect(completionDateFromInput("1969-12-31", NOW)).toBeNull();
    expect(completionDateFromInput("1970-01-01", NOW)).toBe("1970-01-01T12:00:00.000Z");
  });

  it("refuses anything that is not a real day", () => {
    expect(completionDateFromInput("", NOW)).toBeNull();
    expect(completionDateFromInput("2025-02-30", NOW)).toBeNull();
    expect(completionDateFromInput("12/05/2025", NOW)).toBeNull();
  });
});
