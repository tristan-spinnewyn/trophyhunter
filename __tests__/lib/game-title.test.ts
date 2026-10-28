// __tests__/lib/game-title.test.ts
import { describe, it, expect } from "vitest";
import { normalizeGameTitle } from "@/lib/game-title";

describe("normalizeGameTitle", () => {
  it("lowercases and drops punctuation and spaces", () => {
    expect(normalizeGameTitle("Marvel's Spider-Man: Miles Morales")).toBe("marvelsspidermanmilesmorales");
  });

  it.each([
    ["The Witcher 3 Game of the Year Edition", "thewitcher3"],
    ["Fallout 4 GOTY Edition", "fallout4"],
    ["Control Ultimate Edition", "control"],
    ["Borderlands Complete Edition", "borderlands"],
    ["Death Stranding Director's Cut", "deathstranding"],
    ["Skyrim Special Edition", "skyrim"],
  ])("strips the edition suffix from %s", (title, expected) => {
    expect(normalizeGameTitle(title)).toBe(expected);
  });
});
