// __tests__/lib/hunting/hunting-warning.services.test.ts

import { describe, it, expect } from "vitest";
import {
  isValidHuntingWarningType,
  isOnlineAchievement,
  isUnobtainableAchievement,
  detectHuntingWarning,
} from "@/lib/hunting/hunting-warning.services";
import type { Achievement } from "@/lib/types";

describe("hunting-warning.services", () => {
  it("validates HuntingWarningType correctly", () => {
    expect(isValidHuntingWarningType("none")).toBe(true);
    expect(isValidHuntingWarningType("online-required")).toBe(true);
    expect(isValidHuntingWarningType("unobtainable")).toBe(true);
    expect(isValidHuntingWarningType("bugged")).toBe(true);
    expect(isValidHuntingWarningType("unknown")).toBe(false);
    expect(isValidHuntingWarningType(null)).toBe(false);
  });

  it("identifies online achievements from French and English descriptions", () => {
    expect(
      isOnlineAchievement({ name: "Gagner 10 matchs", desc: "En mode multijoueur classé" })
    ).toBe(true);
    expect(
      isOnlineAchievement({ name: "Team Player", desc: "Complete a co-op mission" })
    ).toBe(true);
    expect(
      isOnlineAchievement({ name: "Prologue", desc: "Terminer le chapitre 1" })
    ).toBe(false);
  });

  it("identifies unobtainable achievements via keywords or 0% online rate", () => {
    expect(
      isUnobtainableAchievement(
        { name: "Legacy", desc: "Événement terminé (serveurs fermés)", percent: 12 },
        true
      )
    ).toBe(true);
    expect(
      isUnobtainableAchievement(
        { name: "Champion", desc: "Gagner en matchmaking en ligne", percent: 0 },
        true
      )
    ).toBe(true);
    expect(
      isUnobtainableAchievement(
        { name: "Champion", desc: "Gagner en matchmaking en ligne", percent: 0 },
        false
      )
    ).toBe(false);
  });

  it("detects warnings across a game achievement list", () => {
    expect(detectHuntingWarning([])).toEqual({
      warningType: "none",
      warningMessage: null,
      onlineCount: 0,
    });

    const soloList: Achievement[] = [
      { id: "1", name: "Histoire", desc: "Finir le jeu", icon: "", percent: 60, hidden: false, missable: false },
    ];
    expect(detectHuntingWarning(soloList).warningType).toBe("none");

    const onlineList: Achievement[] = [
      ...soloList,
      { id: "2", name: "Coop", desc: "Jouer en ligne avec un ami", icon: "", percent: 15, hidden: false, missable: false },
    ];
    const onlineResult = detectHuntingWarning(onlineList);
    expect(onlineResult.warningType).toBe("online-required");
    expect(onlineResult.onlineCount).toBe(1);

    const deadServerList: Achievement[] = [
      ...soloList,
      { id: "3", name: " Serveur", desc: "Matchmaking classé", icon: "", percent: 0, hidden: false, missable: false },
    ];
    const deadResult = detectHuntingWarning(deadServerList);
    expect(deadResult.warningType).toBe("unobtainable");
    expect(deadResult.onlineCount).toBe(1);
  });
});
