// __tests__/components/library/triage/triageSummary.test.ts
import { describe, it, expect } from "vitest";
import { describeTriageSession } from "@/components/library/triage/triageSummary";

describe("describeTriageSession", () => {
  it("counts sorted and skipped games with the right plurals", () => {
    expect(describeTriageSession(2, 1)).toBe("2 jeux triés, 1 passé.");
    expect(describeTriageSession(1, 3)).toBe("1 jeu trié, 3 passés.");
  });

  it("only mentions what happened", () => {
    expect(describeTriageSession(4, 0)).toBe("4 jeux triés.");
    expect(describeTriageSession(0, 2)).toBe("2 passés.");
    expect(describeTriageSession(0, 0)).toBe("Rien à trier.");
  });
});
