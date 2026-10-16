// __tests__/epic/sandbox_resolver.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  initDatabase,
  setDbForTesting,
  createUser,
  saveEpicGameSandboxes,
  getEpicGameSandbox,
} from "@/lib/db";
import { resolveEpicSandboxId } from "@/lib/epic/game-achievements";
import { jsonResponse } from "../helpers/responses";

describe("Epic Sandbox Resolution", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setDbForTesting(initDatabase(":memory:"));
  });

  it("persists and retrieves sandbox IDs in database", () => {
    const user = createUser("sandbox_user", "pass123");
    saveEpicGameSandboxes(user.id, [
      { appId: 12345, sandboxId: "ns_alanwake2" },
      { appId: 67890, sandboxId: "ns_control" },
      { appId: 11111, sandboxId: "" },
    ]);

    expect(getEpicGameSandbox(user.id, 12345)).toBe("ns_alanwake2");
    expect(getEpicGameSandbox(user.id, 67890)).toBe("ns_control");
    expect(getEpicGameSandbox(user.id, 11111)).toBeNull();
    expect(getEpicGameSandbox(user.id, 99999)).toBeNull();
  });

  it("resolves sandboxId from library items by title", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      jsonResponse({
        records: [
          {
            appName: "AlanWake2",
            catalogNamespace: "ns_alanwake2_hex",
            metadata: { title: "Alan Wake 2" },
          },
        ],
      })
    );

    const resolved = await resolveEpicSandboxId(99999, "Alan Wake 2", "token_1");
    expect(resolved).toBe("ns_alanwake2_hex");
  });
});
