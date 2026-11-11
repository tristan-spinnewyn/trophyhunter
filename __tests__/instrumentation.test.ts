// __tests__/instrumentation.test.ts
import { describe, it, expect, vi, afterEach } from "vitest";

const { startAutoSyncScheduler } = vi.hoisted(() => ({ startAutoSyncScheduler: vi.fn() }));
vi.mock("@/lib/accounts/auto-sync-scheduler", () => ({ startAutoSyncScheduler }));

import { register } from "@/instrumentation";

describe("instrumentation register", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    startAutoSyncScheduler.mockReset();
  });

  it("starts the automatic sync on the Node.js server", async () => {
    vi.stubEnv("NEXT_RUNTIME", "nodejs");

    await register();

    expect(startAutoSyncScheduler).toHaveBeenCalled();
  });

  it("does not start it on the edge runtime", async () => {
    vi.stubEnv("NEXT_RUNTIME", "edge");

    await register();

    expect(startAutoSyncScheduler).not.toHaveBeenCalled();
  });

  it("does not start it when AUTO_SYNC_ENABLED is false", async () => {
    vi.stubEnv("NEXT_RUNTIME", "nodejs");
    vi.stubEnv("AUTO_SYNC_ENABLED", "false");

    await register();

    expect(startAutoSyncScheduler).not.toHaveBeenCalled();
  });
});
