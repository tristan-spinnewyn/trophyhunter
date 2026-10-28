// __tests__/lib/steam/game-sync-parsers.test.ts
import { describe, it, expect } from "vitest";
import { parseSteamSyncHtml, parseSteamSyncXml, validateAndBuildSteamSyncUrls } from "@/lib/steam/game-sync";

const achieveRow = (title: string, unlocked: boolean) =>
  `<div class="achieveRow "><h3 class="ellipsis">${title}</h3>${unlocked ? '<div class="achieveUnlockTime">Débloqué le 1 janv.</div>' : ""}</div>`;

describe("validateAndBuildSteamSyncUrls", () => {
  it("builds the XML stats and schema URLs for a vanity name", () => {
    const res = validateAndBuildSteamSyncUrls("gabelogannewell", "620");

    expect(res.isVanity).toBe(true);
    expect(res.userIdentifier).toBe("gabelogannewell");
    expect(res.xmlUrl.href).toBe("https://steamcommunity.com/id/gabelogannewell/stats/620/?xml=1");
    expect(res.schemaUrl.searchParams.get("appid")).toBe("620");
    expect(res.schemaUrl.searchParams.get("language")).toBe("french");
  });

  it("reads a SteamID64 from a profile URL", () => {
    const res = validateAndBuildSteamSyncUrls("https://steamcommunity.com/profiles/76561197960287930/", "10");

    expect(res.isVanity).toBe(false);
    expect(res.xmlUrl.pathname).toBe("/profiles/76561197960287930/stats/10/");
  });

  it.each([
    ["gabe", "12a", "Paramètre 'appId' invalide"],
    ["x", "10", "Pseudo ou identifiant Steam personnalisé invalide"],
    ["https://steamcommunity.com/profiles/123/", "10", "SteamID64 invalide"],
  ])("rejects user %s / app %s with a 400", (user, appId, message) => {
    expect(() => validateAndBuildSteamSyncUrls(user, appId)).toThrow(message);
    try {
      validateAndBuildSteamSyncUrls(user, appId);
    } catch (err) {
      expect((err as { status?: number }).status).toBe(400);
    }
  });
});

describe("parseSteamSyncHtml", () => {
  it("reads the game name and unlocked titles from the player's page", () => {
    const html = `<title>Steam Community :: Portal 2 :: Player</title>${achieveRow("Wake Up Call", true)}${achieveRow("You Monster", false)}`;

    expect(parseSteamSyncHtml(html, "")).toEqual({
      gameName: "Portal 2",
      totalAchievements: 2,
      unlockedTitles: ["Wake Up Call"],
      unlockedIds: [],
    });
  });

  it("uses the global page for the total and builds ids for unlocked titles", () => {
    const html = achieveRow("Wake Up Call", true) + achieveRow("It’s a Trap", true);
    const globalHtml = achieveRow("Wake Up Call", false) + achieveRow("You Monster", false) + achieveRow("It's a Trap", false);

    const res = parseSteamSyncHtml(html, globalHtml);

    expect(res.totalAchievements).toBe(3);
    expect(res.unlockedIds).toEqual(["ach_1_wake_up_call", "ach_3_it_s_a_trap"]);
  });
});

describe("parseSteamSyncXml", () => {
  const xml = `<gameName><![CDATA[Half-Life 2]]></gameName>
    <achievement closed="1"><apiname><![CDATA[HL2_HIT_CANCOP]]></apiname><name><![CDATA[Defiant]]></name></achievement>
    <achievement closed="0"><apiname>HL2_KILL_TWOGUNSHIPS</apiname><name>Attica!</name></achievement>`;

  it("matches unlocked achievements against the schema by api name", () => {
    const schema = [
      { internal_name: "HL2_HIT_CANCOP", localized_name: "Défiant" },
      { internal_name: "HL2_KILL_TWOGUNSHIPS", localized_name: "Attica !" },
    ];

    expect(parseSteamSyncXml(xml, schema)).toEqual({
      gameName: "Half-Life 2",
      totalAchievements: 2,
      unlockedTitles: ["Défiant"],
      unlockedIds: ["ach_1_d_fiant"],
    });
  });

  it("falls back to the XML list without a schema", () => {
    expect(parseSteamSyncXml(xml, null)).toEqual({
      gameName: "Half-Life 2",
      totalAchievements: 2,
      unlockedTitles: ["Defiant"],
      unlockedIds: ["ach_1_defiant"],
    });
  });
});
