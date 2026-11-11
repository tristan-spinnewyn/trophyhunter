// __tests__/lib/wishlist/release-label.test.ts
import { describe, it, expect } from "vitest";
import { describeRelease } from "@/lib/wishlist/release-label";

const now = new Date("2027-03-10T15:00:00.000Z");
const on = (day: string) => `${day}T00:00:00.000Z`;

describe("describeRelease", () => {
  it("counts down to a coming release", () => {
    expect(describeRelease(on("2027-03-11"), now)).toEqual({ text: "Sort demain", isOut: false });
    expect(describeRelease(on("2027-03-22"), now)).toEqual({ text: "Sort dans 12 j", isOut: false });
    expect(describeRelease(on("2027-05-09"), now)).toEqual({ text: "Sort dans 60 j", isOut: false });
  });

  it("dates a release further away", () => {
    expect(describeRelease(on("2027-09-03"), now)).toEqual({ text: "Sort le 3 septembre 2027", isOut: false });
  });

  it("celebrates a release of the last two weeks", () => {
    expect(describeRelease(on("2027-03-10"), now)).toEqual({ text: "Sort aujourd'hui", isOut: true });
    expect(describeRelease(on("2027-03-01"), now)).toEqual({ text: "Sorti !", isOut: true });
  });

  it("says nothing for an older or unknown release", () => {
    expect(describeRelease(on("2027-02-20"), now)).toBeNull();
    expect(describeRelease(undefined, now)).toBeNull();
    expect(describeRelease("bientôt", now)).toBeNull();
  });
});
