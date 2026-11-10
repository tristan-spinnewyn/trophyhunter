// __tests__/components/platform-sync/useBacklogOrderHandler.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { useBacklogOrderHandler } from "@/components/platform-sync/hooks/useBacklogOrderHandler";
import { makeOwnedGame } from "../../helpers/gameFixtures";
import type { OwnedGame } from "@/lib/types";

describe("useBacklogOrderHandler", () => {
  const games: OwnedGame[] = [
    makeOwnedGame({ appId: 1, status: "backlog", backlogRank: 2 }),
    makeOwnedGame({ appId: 2, status: "backlog" }),
    makeOwnedGame({ appId: 3, platform: "gog", status: "backlog" }),
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  function setup() {
    let memory = games;
    const onOwnedGamesChange = vi.fn((next: OwnedGame[]) => {
      memory = next;
    });
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}"));
    const props = { ownedGames: games, onOwnedGamesChange };
    return { props, fetchMock, rankOf: (appId: number) => memory.find((g) => g.appId === appId)?.backlogRank };
  }

  it("moves a game ahead of the queue in memory and on the server", async () => {
    const { props, fetchMock, rankOf } = setup();
    const handler = useBacklogOrderHandler(props);

    await handler.handlePlayNext(3, "gog");

    expect(rankOf(3)).toBe(1);
    expect(rankOf(1)).toBe(2);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/user/games",
      expect.objectContaining({ method: "PATCH", body: JSON.stringify({ appId: 3, platform: "gog", backlogRank: 1 }) })
    );
  });

  it("takes a game out of the queue", async () => {
    const { props, fetchMock, rankOf } = setup();
    const handler = useBacklogOrderHandler(props);

    await handler.handleRemoveFromQueue(1, "steam");

    expect(rankOf(1)).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/user/games",
      expect.objectContaining({ body: JSON.stringify({ appId: 1, platform: "steam", backlogRank: null }) })
    );
  });

  it("keeps the change in memory when the server cannot be reached", async () => {
    const { props, fetchMock, rankOf } = setup();
    const handler = useBacklogOrderHandler(props);
    fetchMock.mockRejectedValue(new Error("offline"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    await handler.handlePlayNext(2, "steam");

    expect(rankOf(2)).toBe(1);
  });
});
