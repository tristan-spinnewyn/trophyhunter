// __tests__/lib/game/manual-game.test.ts
import { describe, it, expect } from "vitest";
import { isManualGameId, manualGameDetails, manualGameId } from "@/lib/game/manual-game";

describe("manualGameId", () => {
  it("gives the same id to the same title, whatever its case and spacing", () => {
    expect(manualGameId("Zelda: Tears of the Kingdom")).toBe(manualGameId("  zelda: tears of the kingdom "));
  });

  it("gives different titles different ids, in the range kept for games added by hand", () => {
    const a = manualGameId("Mario Kart 8");
    const b = manualGameId("Splatoon 3");
    expect(a).not.toBe(b);
    expect(isManualGameId(a)).toBe(true);
    expect(Number.isInteger(a) && a > 0).toBe(true);
  });

  it("does not mistake a store id for a game added by hand", () => {
    expect(isManualGameId(620)).toBe(false);
    expect(isManualGameId(2_500_000)).toBe(false);
  });
});

describe("manualGameDetails", () => {
  it("describes a game added by hand: its name, no achievements, guides searched by name", () => {
    const details = manualGameDetails(manualGameId("Hollow Knight Silksong"), "Hollow Knight Silksong");

    expect(details).toMatchObject({ name: "Hollow Knight Silksong", totalAchievements: 0, achievements: [], headerImg: "" });
    expect(details.guideLinks.steamGuidesUrl).toBe("");
    expect(details.guideLinks.youtubeUrl).toContain("Hollow%20Knight%20Silksong");
  });
});
