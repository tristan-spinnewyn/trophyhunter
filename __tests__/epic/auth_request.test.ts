// __tests__/epic/auth_request.test.ts
import { describe, it, expect } from "vitest";
import { readAuthInput, EPIC_AUTH_HEADER } from "@/lib/epic/auth-request";
import { buildEpicAuthHeaders } from "@/lib/epic/auth-headers";

describe("readAuthInput", () => {
  it.each(["authorizationToken", "authorization_token", "authorizationCode", "authorization_code", "code", "token"])(
    "ignores secrets passed in the '%s' query parameter",
    (param) => {
      const req = new Request(`http://localhost/api/sync?${param}=leaked-secret`);
      expect(readAuthInput(req)).toBe("");
    }
  );

  it("reads the token from the dedicated header", () => {
    const req = new Request("http://localhost/api/sync", {
      headers: { [EPIC_AUTH_HEADER]: "  header-code  " },
    });
    expect(readAuthInput(req)).toBe("header-code");
  });

  it("reads the token from a Bearer authorization header", () => {
    const req = new Request("http://localhost/api/sync", {
      headers: { authorization: "Bearer bearer-code" },
    });
    expect(readAuthInput(req)).toBe("bearer-code");
  });
});

describe("buildEpicAuthHeaders", () => {
  it("returns no header when there is no token", () => {
    expect(buildEpicAuthHeaders("")).toEqual({});
    expect(buildEpicAuthHeaders(undefined)).toEqual({});
  });

  it("normalizes pasted Epic JSON into the auth header", () => {
    const pasted = JSON.stringify({ redirectUrl: "https://localhost", authorizationCode: "abc123" });
    expect(buildEpicAuthHeaders(pasted)).toEqual({ [EPIC_AUTH_HEADER]: "abc123" });
  });
});
