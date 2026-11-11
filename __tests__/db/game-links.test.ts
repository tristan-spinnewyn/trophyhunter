// __tests__/db/game-links.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { initDatabase, setDbForTesting, createUser, saveUserOwnedGames, getUserOwnedGames, linkGames, unlinkGames } from "@/lib/db";
import { makeOwnedGame } from "../helpers/gameFixtures";

const mergedIntoOf = (userId: string) =>
  Object.fromEntries(getUserOwnedGames(userId).map((g) => [`${g.platform}_${g.appId}`, g.mergedInto ?? null]));

describe("game links", () => {
  let userId: string;

  beforeEach(() => {
    setDbForTesting(initDatabase(":memory:"));
    userId = createUser("LinkUser", "password123").id;
    saveUserOwnedGames(userId, [
      makeOwnedGame({ appId: 1, platform: "steam", name: "Hades" }),
      makeOwnedGame({ appId: 2, platform: "xbox", name: "Hades" }),
      makeOwnedGame({ appId: 3, platform: "gog", name: "Hades" }),
    ]);
  });

  afterEach(() => {
    setDbForTesting(null);
  });

  it("merges copies into a primary game and reads the link back with the collection", () => {
    expect(linkGames(userId, { platform: "steam", appId: 1 }, [{ platform: "xbox", appId: 2 }, { platform: "gog", appId: 3 }])).toBe(true);

    expect(mergedIntoOf(userId)).toEqual({
      steam_1: null,
      xbox_2: { platform: "steam", appId: 1 },
      gog_3: { platform: "steam", appId: 1 },
    });
  });

  it("refuses games outside the collection, or a game merged into itself", () => {
    expect(linkGames(userId, { platform: "steam", appId: 1 }, [{ platform: "xbox", appId: 99 }])).toBe(false);
    expect(linkGames(userId, { platform: "steam", appId: 99 }, [{ platform: "xbox", appId: 2 }])).toBe(false);
    expect(linkGames(userId, { platform: "steam", appId: 1 }, [{ platform: "steam", appId: 1 }])).toBe(false);
    expect(mergedIntoOf(userId).xbox_2).toBeNull();
  });

  it("moves the copies of a game that becomes a copy itself to the new primary", () => {
    linkGames(userId, { platform: "xbox", appId: 2 }, [{ platform: "gog", appId: 3 }]);

    linkGames(userId, { platform: "steam", appId: 1 }, [{ platform: "xbox", appId: 2 }]);

    expect(mergedIntoOf(userId)).toEqual({
      steam_1: null,
      xbox_2: { platform: "steam", appId: 1 },
      gog_3: { platform: "steam", appId: 1 },
    });
  });

  it("unmerges every copy of a primary game", () => {
    linkGames(userId, { platform: "steam", appId: 1 }, [{ platform: "xbox", appId: 2 }, { platform: "gog", appId: 3 }]);

    expect(unlinkGames(userId, { platform: "steam", appId: 1 })).toBe(true);
    expect(unlinkGames(userId, { platform: "steam", appId: 1 })).toBe(false);
    expect(Object.values(mergedIntoOf(userId))).toEqual([null, null, null]);
  });

  it("keeps the links when a sync writes the games again", () => {
    linkGames(userId, { platform: "steam", appId: 1 }, [{ platform: "xbox", appId: 2 }]);

    saveUserOwnedGames(userId, [makeOwnedGame({ appId: 2, platform: "xbox", name: "Hades", playtimeHours: 9 })]);

    expect(mergedIntoOf(userId).xbox_2).toEqual({ platform: "steam", appId: 1 });
  });
});
