// __tests__/security/content-security-policy.test.ts
import { describe, it, expect } from "vitest";
import { buildContentSecurityPolicy } from "@/lib/security/content-security-policy";

function directives(policy: string): Map<string, string[]> {
  return new Map(
    policy
      .split(";")
      .map((part) => part.trim().split(/\s+/))
      .filter((tokens) => tokens[0])
      .map(([name, ...sources]) => [name, sources])
  );
}

describe("buildContentSecurityPolicy", () => {
  const production = directives(buildContentSecurityPolicy({ isDevelopment: false }));

  it("only lets the page talk to its own server, so injected code cannot send data elsewhere", () => {
    expect(production.get("default-src")).toEqual(["'self'"]);
    expect(production.get("connect-src")).toEqual(["'self'"]);
    expect(production.get("form-action")).toEqual(["'self'"]);
  });

  it("loads scripts from the app only, never from another host or through eval", () => {
    const scripts = production.get("script-src") ?? [];
    expect(scripts).toContain("'self'");
    expect(scripts).not.toContain("'unsafe-eval'");
    expect(scripts.some((source) => source.startsWith("http") || source === "*")).toBe(false);
  });

  it("allows game covers and avatars from any HTTPS host", () => {
    expect(production.get("img-src")).toEqual(["'self'", "data:", "blob:", "https:"]);
  });

  it("lets canvas-confetti run its animation in a worker built from a blob URL", () => {
    expect(production.get("worker-src")).toEqual(["'self'", "blob:"]);
  });

  it("blocks plugins, base tag hijacking and framing", () => {
    expect(production.get("object-src")).toEqual(["'none'"]);
    expect(production.get("base-uri")).toEqual(["'self'"]);
    expect(production.get("frame-ancestors")).toEqual(["'none'"]);
  });

  it("lets the dev server evaluate code for hot reload, in development only", () => {
    const development = directives(buildContentSecurityPolicy({ isDevelopment: true }));
    expect(development.get("script-src")).toContain("'unsafe-eval'");
  });
});
