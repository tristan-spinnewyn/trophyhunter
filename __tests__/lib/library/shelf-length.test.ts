import { describe, it, expect } from "vitest";
import { shelfLengthBars } from "@/lib/library/shelf-length";

describe("shelfLengthBars", () => {
  it("gives the largest platform the full shelf", () => {
    expect(shelfLengthBars(128, 128)).toBe(24);
  });

  it("scales the other platforms to their share", () => {
    expect(shelfLengthBars(64, 128)).toBe(12);
    expect(shelfLengthBars(24, 128)).toBe(5);
  });

  it("shows at least one spine for a platform with games", () => {
    expect(shelfLengthBars(1, 500)).toBe(1);
  });

  it("shows nothing for an empty platform", () => {
    expect(shelfLengthBars(0, 128)).toBe(0);
    expect(shelfLengthBars(0, 0)).toBe(0);
  });

  it("accepts a custom shelf size", () => {
    expect(shelfLengthBars(10, 10, 8)).toBe(8);
  });
});
