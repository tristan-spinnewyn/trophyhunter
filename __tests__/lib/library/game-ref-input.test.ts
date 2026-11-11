// __tests__/lib/library/game-ref-input.test.ts
import { describe, it, expect } from "vitest";
import { parseGameRef } from "@/lib/library/game-ref-input";

describe("parseGameRef", () => {
  it("reads a known platform and a whole app id", () => {
    expect(parseGameRef({ platform: "gog", appId: 42 })).toEqual({ platform: "gog", appId: 42 });
  });

  it("rejects anything else", () => {
    for (const value of [null, "steam_1", { platform: "atari", appId: 1 }, { platform: "steam", appId: "1" }, { platform: "steam", appId: 1.5 }]) {
      expect(parseGameRef(value)).toBeNull();
    }
  });
});
