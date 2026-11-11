// __tests__/lib/backup/weekly-backup-job.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { initDatabase, setDbForTesting, createUser, saveUserOwnedGames } from "@/lib/db";
import { KEPT_BACKUPS, writeWeeklyBackups } from "@/lib/backup/weekly-backup-job";
import { makeOwnedGame } from "../../helpers/gameFixtures";

const day = (n: number) => new Date(Date.UTC(2027, 0, 1 + n, 3));

describe("writeWeeklyBackups", () => {
  let dir: string;
  let userId: string;
  const filesOf = (id: string) => fs.readdirSync(path.join(dir, id)).sort();

  beforeEach(() => {
    setDbForTesting(initDatabase(":memory:"));
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "th-backups-"));
    userId = createUser("Weekly", "password123").id;
    saveUserOwnedGames(userId, [makeOwnedGame({ appId: 1, status: "backlog" })]);
  });

  afterEach(() => {
    setDbForTesting(null);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("writes a dated backup file per user", async () => {
    expect(await writeWeeklyBackups(day(0), dir)).toBe(1);

    expect(filesOf(userId)).toEqual(["trophyhunter-2027-01-01.json"]);
    const saved = JSON.parse(fs.readFileSync(path.join(dir, userId, "trophyhunter-2027-01-01.json"), "utf8"));
    expect(saved).toMatchObject({ format: "trophyhunter-backup", games: [expect.objectContaining({ appId: 1 })] });
  });

  it("waits a week before the next backup", async () => {
    await writeWeeklyBackups(day(0), dir);

    expect(await writeWeeklyBackups(day(6), dir)).toBe(0);
    expect(await writeWeeklyBackups(day(7), dir)).toBe(1);
    expect(filesOf(userId)).toEqual(["trophyhunter-2027-01-01.json", "trophyhunter-2027-01-08.json"]);
  });

  it("keeps only the latest backups", async () => {
    for (let week = 0; week < KEPT_BACKUPS + 2; week++) await writeWeeklyBackups(day(week * 7), dir);

    const files = filesOf(userId);
    expect(files).toHaveLength(KEPT_BACKUPS);
    expect(files[0]).toBe("trophyhunter-2027-01-15.json");
  });
});
