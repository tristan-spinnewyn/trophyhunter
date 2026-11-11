// __tests__/lib/igdb/igdb-game-resolver.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const { igdbQuery } = vi.hoisted(() => ({ igdbQuery: vi.fn() }));
vi.mock("@/lib/igdb/igdb-client", () => ({ igdbQuery }));

import { resolveIgdbGameIds } from "@/lib/igdb/igdb-game-resolver";

describe("resolveIgdbGameIds", () => {
  beforeEach(() => igdbQuery.mockReset());

  it("tells the games it found from those it looked up without finding", async () => {
    igdbQuery.mockImplementation(async (endpoint: string) => (endpoint === "external_games" ? [{ game: 72, uid: "620" }] : []));

    const { ids, looked } = await resolveIgdbGameIds(
      [{ appId: 620, platform: "steam", name: "Portal 2" }, { appId: 1, platform: "xbox", name: "Nope" }],
      { pause: async () => {} }
    );

    expect([...ids]).toEqual([["steam_620", 72]]);
    expect([...looked].sort()).toEqual(["steam_620", "xbox_1"]);
  });
});
