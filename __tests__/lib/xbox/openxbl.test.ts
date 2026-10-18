// __tests__/lib/xbox/openxbl.test.ts

import { describe, it, expect } from "vitest";
import {
  hashCode,
  unwrapOpenXblPayload,
  parseOpenXblProfile,
  parseOpenXblTitles,
} from "@/lib/xbox/openxbl";

describe("lib/xbox/openxbl", () => {
  it("unwraps OpenXBL v2 content envelope or returns direct payload", () => {
    const wrapped = { content: { titles: [{ titleId: "1", name: "Halo" }] }, code: 200 };
    expect(unwrapOpenXblPayload<{ titles: unknown[] }>(wrapped).titles).toHaveLength(1);

    const direct = { titles: [{ titleId: "2", name: "Fable" }] };
    expect(unwrapOpenXblPayload<{ titles: unknown[] }>(direct).titles).toHaveLength(1);
    expect(unwrapOpenXblPayload(null)).toEqual({});
  });

  it("parses profile settings and falls back to person or fallbackUser", () => {
    const profile = {
      id: "2533274792093122",
      settings: [
        { id: "Gamertag", value: "MasterChief" },
        { id: "GameDisplayPicRaw", value: "https://img.xbox.com/avatar.png" },
        { id: "Gamerscore", value: "42000" },
      ],
    };
    expect(parseOpenXblProfile(profile, "fallback")).toEqual({
      xuid: "2533274792093122",
      gamerTag: "MasterChief",
      avatarUrl: "https://img.xbox.com/avatar.png",
      gamerScore: 42000,
    });

    const fromPerson = parseOpenXblProfile(undefined, "raw", {
      xuid: "999",
      gamertag: "Cortana",
      displayPicRaw: "https://img.xbox.com/c.png",
      gamerScore: "1500",
    });
    expect(fromPerson).toEqual({
      xuid: "999",
      gamerTag: "Cortana",
      avatarUrl: "https://img.xbox.com/c.png",
      gamerScore: 1500,
    });
  });

  it("parses titles, estimates totalAchievements from progressPercentage, and filters non-games", () => {
    const titles = [
      {
        titleId: "1144039928",
        name: "Halo: The Master Chief Collection",
        type: "Game",
        displayImage: "http://store-images.s-microsoft.com/image/halo.jpg",
        achievement: {
          currentAchievements: 17,
          totalAchievements: 0,
          currentGamerscore: 200,
          totalGamerscore: 1000,
          progressPercentage: 17,
        },
      },
      {
        titleId: "999999",
        name: "Netflix",
        type: "App",
      },
      {
        titleId: "abc-id",
        name: "Gears 5",
        achievements: [
          { id: "1", isUnlocked: true },
          { id: "2", progressState: "Achieved" },
        ],
        currentGamerscore: 1000,
        maxGamerscore: 1000,
      },
    ];

    const res = parseOpenXblTitles(titles, "2026-10-18T00:00:00.000Z");
    expect(res.discoveredGames).toHaveLength(2);
    expect(res.discoveredGames[0].headerImg).toBe("https://store-images.s-microsoft.com/image/halo.jpg");
    expect(res.discoveredGames[0].totalAchievements).toBe(100);
    expect(res.discoveredGames[0].unlockedCount).toBe(17);
    expect(res.discoveredGames[1].appId).toBe(Math.abs(hashCode("abc-id")));
    expect(res.completedGames).toBe(1);
    expect(res.totalAchievements).toBe(19);
    expect(res.titlesGamerScore).toBe(1200);
  });
});
