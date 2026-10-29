// __tests__/lib/accounts/profile-sync-client.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { postProfileSync } from "@/lib/accounts/profile-sync-client";
import { jsonResponse } from "../../helpers/responses";

describe("postProfileSync", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("posts the user and the secret as JSON, never in the URL", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ success: true }));

    await postProfileSync("xbox", { user: "MajorNelson", secret: "key-123" });

    expect(fetchSpy).toHaveBeenCalledWith("/api/profile/xbox", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: "MajorNelson", secret: "key-123" }),
    });
  });

  it("merges extra headers such as the Epic authorization code", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ success: true }));

    await postProfileSync("epic", { user: "" }, { "x-authorization-token": "code" });

    expect(fetchSpy).toHaveBeenCalledWith("/api/profile/epic", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-authorization-token": "code" },
      body: JSON.stringify({ user: "" }),
    });
  });
});
