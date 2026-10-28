// __tests__/config/security-headers.test.ts
import { describe, it, expect } from "vitest";
import nextConfig from "@/next.config";

async function findHeader(key: string): Promise<string | undefined> {
  const rules = (await nextConfig.headers?.()) ?? [];
  return rules.flatMap((rule) => rule.headers).find((header) => header.key === key)?.value;
}

describe("security headers", () => {
  it("sends HSTS without preload or includeSubDomains, which would bind every subdomain of a self-hosted domain", async () => {
    const hsts = await findHeader("Strict-Transport-Security");

    expect(hsts).toBe("max-age=31536000");
  });

  it("forbids framing the app", async () => {
    expect(await findHeader("X-Frame-Options")).toBe("DENY");
  });
});
