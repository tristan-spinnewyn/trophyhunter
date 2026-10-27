// __tests__/security/same-origin-policy.test.ts
import { describe, it, expect } from "vitest";
import { enforceSameOriginForMutations } from "@/lib/security/same-origin-policy";

const API_URL = "https://trophyhunter.local/api/user/games";

function buildRequest(method: string, headers: Record<string, string>): Request {
  return new Request(API_URL, { method, headers });
}

function isPassThrough(res: Response): boolean {
  return res.headers.get("x-middleware-next") === "1";
}

describe("enforceSameOriginForMutations", () => {
  it.each(["GET", "HEAD", "OPTIONS"])("lets safe %s requests through without an Origin header", (method) => {
    const res = enforceSameOriginForMutations(buildRequest(method, { host: "trophyhunter.local" }));
    expect(isPassThrough(res)).toBe(true);
  });

  it.each(["POST", "PUT", "PATCH", "DELETE"])("lets same-origin %s requests through", (method) => {
    const res = enforceSameOriginForMutations(
      buildRequest(method, { origin: "https://trophyhunter.local", host: "trophyhunter.local" })
    );
    expect(isPassThrough(res)).toBe(true);
  });

  it.each(["POST", "PUT", "PATCH", "DELETE"])("rejects cross-origin %s requests with 403", async (method) => {
    const res = enforceSameOriginForMutations(
      buildRequest(method, { origin: "https://evil.example.com", host: "trophyhunter.local" })
    );
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Cross-origin request denied" });
  });

  it("rejects mutating requests that carry no Origin header", () => {
    const res = enforceSameOriginForMutations(buildRequest("POST", { host: "trophyhunter.local" }));
    expect(res.status).toBe(403);
  });

  it("rejects a sibling subdomain origin", () => {
    const res = enforceSameOriginForMutations(
      buildRequest("POST", { origin: "https://evil.trophyhunter.local", host: "trophyhunter.local" })
    );
    expect(res.status).toBe(403);
  });
});
