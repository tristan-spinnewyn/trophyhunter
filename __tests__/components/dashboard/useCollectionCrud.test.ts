// @vitest-environment jsdom
// __tests__/components/dashboard/useCollectionCrud.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useCollectionCrud } from "@/components/dashboard/hooks/useCollectionCrud";
import type { CollectionWithGames, OwnedGame } from "@/lib/types";
import { jsonResponse } from "../../helpers/responses";

const user = { id: "u1", username: "gabe", displayName: "Gabe", createdAt: "x" };
const game = { appId: 7, name: "Hades", headerImg: "", platform: "epic", totalAchievements: 0, unlockedCount: 0, addedAt: "x" } as OwnedGame;
const initial: CollectionWithGames[] = [{ id: "c1", name: "RPG", gameIds: [1] }];

function setup(currentUser: typeof user | null) {
  const onCollectionsChange = vi.fn();
  const setBannerMsg = vi.fn();
  const hook = renderHook(() => useCollectionCrud({ currentUser, initialCollections: initial, onCollectionsChange, setBannerMsg }));
  return { ...hook, onCollectionsChange, setBannerMsg };
}

describe("useCollectionCrud", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("creates a collection on the server for a signed-in user and selects it", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ collection: { id: "srv1" } }));
    const { result, onCollectionsChange } = setup(user);

    await act(() => result.current.handleCreateCollection());
    expect(fetchSpy).not.toHaveBeenCalled();

    act(() => { result.current.setNewCollName(" Indies "); result.current.setNewCollDesc(" small games "); });
    await act(() => result.current.handleCreateCollection());

    expect(JSON.parse(String(fetchSpy.mock.calls[0][1]?.body))).toEqual({ name: "Indies", description: "small games", color: "#6366f1" });
    expect(result.current.collections.map((c) => c.id)).toEqual(["c1", "srv1"]);
    expect(result.current.selectedCollId).toBe("srv1");
    expect(result.current.newCollName).toBe("");
    expect(onCollectionsChange).toHaveBeenCalledTimes(1);
  });

  it("creates a local collection id when signed out or when the server fails", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}, 500));
    const signedOut = setup(null);
    act(() => signedOut.result.current.setNewCollName("Local"));
    await act(() => signedOut.result.current.handleCreateCollection());
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(signedOut.result.current.collections[1].id).toMatch(/^coll_\d+$/);

    const failing = setup(user);
    act(() => failing.result.current.setNewCollName("Server down"));
    await act(() => failing.result.current.handleCreateCollection());
    expect(failing.result.current.collections[1].id).toMatch(/^coll_\d+$/);
  });

  it("adds and removes games, and deletes the selected collection", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ success: true }));
    const { result, setBannerMsg } = setup(user);
    act(() => result.current.setSelectedCollId("c1"));

    await act(() => result.current.handleAddGameToColl("c1", game));
    await act(() => result.current.handleAddGameToColl("c1", game));
    expect(result.current.collections[0].gameIds).toEqual([1, 7]);

    await act(() => result.current.handleRemoveGameFromColl("c1", 1, "steam"));
    expect(result.current.collections[0].gameIds).toEqual([7]);
    expect(fetchSpy).toHaveBeenCalledWith("/api/collections/c1/games?appId=1&platform=steam", { method: "DELETE" });

    await act(() => result.current.handleDeleteCollection("c1"));
    expect(result.current.collections).toEqual([]);
    expect(result.current.selectedCollId).toBeNull();
    expect(setBannerMsg).toHaveBeenLastCalledWith({ type: "success", text: "Collection supprimée." });
  });

  it("keeps working locally when collection requests throw", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
    const { result } = setup(user);
    await act(() => result.current.handleAddGameToColl("c1", game));
    await act(() => result.current.handleRemoveGameFromColl("c1", 7, "epic"));
    await act(() => result.current.handleDeleteCollection("c1"));
    expect(result.current.collections).toEqual([]);
  });
});
