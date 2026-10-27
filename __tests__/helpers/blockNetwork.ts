// __tests__/helpers/blockNetwork.ts
// Vitest setup file: tests must never reach the real network. Any fetch that a
// test did not mock is rejected and makes that test fail with the URLs involved.
// vi.spyOn(global, "fetch") wraps this guard, so calls left over once its
// mocked responses run out are caught here too.
import { afterEach } from "vitest";
import { networkGuard } from "./networkGuard";

globalThis.fetch = networkGuard.fetch;

afterEach(() => {
  const urls = networkGuard.takeBlockedUrls();
  if (urls.length > 0) {
    throw new Error(`Test tried to reach the real network. Mock these requests:\n${urls.join("\n")}`);
  }
});
