// __tests__/lib/settings/user-settings-input.test.ts
import { describe, it, expect } from "vitest";
import { parseUserSettingsInput } from "@/lib/settings/user-settings-input";

describe("parseUserSettingsInput", () => {
  it("accepts the offered sync intervals and turning it off", () => {
    expect(parseUserSettingsInput({ autoSyncHours: 12 })).toEqual({ ok: true, changes: { autoSyncHours: 12 } });
    expect(parseUserSettingsInput({ autoSyncHours: null })).toEqual({ ok: true, changes: { autoSyncHours: null } });
  });

  it("refuses an interval that is not offered", () => {
    expect(parseUserSettingsInput({ autoSyncHours: 1 }).ok).toBe(false);
  });

  it("accepts a stale threshold between 1 and 52 weeks", () => {
    expect(parseUserSettingsInput({ staleAfterWeeks: 4 })).toEqual({ ok: true, changes: { staleAfterWeeks: 4 } });
    expect(parseUserSettingsInput({ staleAfterWeeks: 0 }).ok).toBe(false);
    expect(parseUserSettingsInput({ staleAfterWeeks: 53 }).ok).toBe(false);
    expect(parseUserSettingsInput({ staleAfterWeeks: 2.5 }).ok).toBe(false);
  });

  it("refuses a body that is not an object", () => {
    expect(parseUserSettingsInput(null).ok).toBe(false);
    expect(parseUserSettingsInput("x").ok).toBe(false);
  });

  it("ignores unknown fields", () => {
    expect(parseUserSettingsInput({ admin: true })).toEqual({ ok: true, changes: {} });
  });
});
