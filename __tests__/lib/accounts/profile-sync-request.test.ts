// __tests__/lib/accounts/profile-sync-request.test.ts
import { describe, it, expect } from "vitest";
import { readProfileSyncRequest } from "@/lib/accounts/profile-sync-request";

function postJson(body: unknown): Request {
  return new Request("http://localhost:3000/api/profile/steam", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("readProfileSyncRequest", () => {
  it("reads and trims the user and the secret from the JSON body", async () => {
    const input = await readProfileSyncRequest(postJson({ user: "  gabe ", secret: " my-key " }));
    expect(input).toEqual({ user: "gabe", secret: "my-key" });
  });

  it("returns empty values for blank or non-string fields", async () => {
    const input = await readProfileSyncRequest(postJson({ user: "   ", secret: 42 }));
    expect(input).toEqual({ user: "", secret: "" });
  });

  it("returns empty values for a malformed or non-object body", async () => {
    expect(await readProfileSyncRequest(postJson("{not json"))).toEqual({ user: "", secret: "" });
    expect(await readProfileSyncRequest(postJson(["gabe"]))).toEqual({ user: "", secret: "" });
    expect(await readProfileSyncRequest(postJson(null))).toEqual({ user: "", secret: "" });
  });

  it("ignores credentials passed in the query string", async () => {
    const request = new Request("http://localhost:3000/api/profile/steam?user=gabe&key=leaked", {
      method: "POST",
      body: "{}",
    });
    expect(await readProfileSyncRequest(request)).toEqual({ user: "", secret: "" });
  });
});
