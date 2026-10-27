// __tests__/security/csrf-guard.test.ts
import { describe, it, expect } from "vitest";
import { verifySameOriginRequest, CsrfOriginError } from "@/lib/security/csrf-guard";

describe("verifySameOriginRequest", () => {
  it("accepts matching Origin and Host headers", () => {
    const req = new Request("https://trophyhunter.local/api/user/account", {
      method: "POST",
      headers: {
        origin: "https://trophyhunter.local",
        host: "trophyhunter.local",
      },
    });
    expect(() => verifySameOriginRequest(req)).not.toThrow();
  });

  it("accepts an Origin matching X-Forwarded-Host when behind a reverse proxy", () => {
    const req = new Request("http://app:3000/api/user/account", {
      method: "POST",
      headers: {
        origin: "https://trophyhunter.example.com",
        host: "app:3000",
        "x-forwarded-host": "trophyhunter.example.com",
      },
    });
    expect(() => verifySameOriginRequest(req)).not.toThrow();
  });

  it("rejects mismatched Origin, malformed Origin, or missing headers", () => {
    const crossOriginReq = new Request("https://trophyhunter.local/api/user/account", {
      method: "POST",
      headers: {
        origin: "https://evil.example.com",
        host: "trophyhunter.local",
      },
    });
    expect(() => verifySameOriginRequest(crossOriginReq)).toThrow(CsrfOriginError);

    const malformedReq = new Request("https://trophyhunter.local/api/user/account", {
      method: "POST",
      headers: {
        origin: "not-a-valid-origin",
        host: "trophyhunter.local",
      },
    });
    expect(() => verifySameOriginRequest(malformedReq)).toThrow(CsrfOriginError);

    const missingOriginReq = new Request("https://trophyhunter.local/api/user/account", {
      method: "POST",
      headers: { host: "trophyhunter.local" },
    });
    expect(() => verifySameOriginRequest(missingOriginReq)).toThrow(CsrfOriginError);
  });
});
