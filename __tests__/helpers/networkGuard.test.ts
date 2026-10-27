// __tests__/helpers/networkGuard.test.ts
import { describe, it, expect } from "vitest";
import { createNetworkGuard } from "./networkGuard";

describe("createNetworkGuard", () => {
  it("rejects every request instead of reaching the network", async () => {
    const guard = createNetworkGuard();

    await expect(guard.fetch("https://api.example.com/data")).rejects.toThrow(
      "Real network call blocked in tests: https://api.example.com/data"
    );
  });

  it("records blocked URLs from strings, URL objects and Requests", async () => {
    const guard = createNetworkGuard();

    await guard.fetch("https://a.example.com/").catch(() => {});
    await guard.fetch(new URL("https://b.example.com/path")).catch(() => {});
    await guard.fetch(new Request("https://c.example.com/req")).catch(() => {});

    expect(guard.takeBlockedUrls()).toEqual([
      "https://a.example.com/",
      "https://b.example.com/path",
      "https://c.example.com/req",
    ]);
  });

  it("clears the recorded URLs once they are taken", async () => {
    const guard = createNetworkGuard();
    await guard.fetch("https://a.example.com/").catch(() => {});

    guard.takeBlockedUrls();

    expect(guard.takeBlockedUrls()).toEqual([]);
  });
});
