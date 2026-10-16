// __tests__/epic/credentials_parsing.test.ts
import { describe, it, expect } from "vitest";
import { parseEpicAuthInput } from "@/lib/epic/credentials";

describe("Epic Credentials Parsing", () => {
  it("parses auth input from JSON payloads", () => {
    expect(parseEpicAuthInput(JSON.stringify({ authorizationCode: "code_123" }))).toBe("code_123");
    expect(parseEpicAuthInput(JSON.stringify({ code: "code_456" }))).toBe("code_456");
  });

  it("extracts hex authorization code from redirect URLs", () => {
    expect(parseEpicAuthInput("https://localhost:3000/?code=a1b2c3d4e5f6")).toBe("a1b2c3d4e5f6");
    expect(parseEpicAuthInput("http://127.0.0.1:8080/cb?code=abc123def456&state=ok")).toBe("abc123def456");
  });

  it("handles raw tokens, empty strings and nulls", () => {
    expect(parseEpicAuthInput("eg1~token_direct")).toBe("eg1~token_direct");
    expect(parseEpicAuthInput("")).toBe("");
    expect(parseEpicAuthInput(null)).toBe("");
  });
});
