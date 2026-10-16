// __tests__/db/connection.test.ts
import { describe, it, expect, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { getDatabasePath, initDatabase } from "@/lib/db";

describe("Database Connection & Schema", () => {
  const originalEnv = process.env.DATABASE_PATH;

  afterEach(() => {
    process.env.DATABASE_PATH = originalEnv;
  });

  it("returns default path when DATABASE_PATH is unset", () => {
    delete process.env.DATABASE_PATH;
    const dbPath = getDatabasePath();
    expect(dbPath).toContain("trophyhunter.db");
  });

  it("respects custom DATABASE_PATH and creates parent directory if needed", () => {
    const customPath = path.join(process.cwd(), "data", "test_sub", "custom.db");
    process.env.DATABASE_PATH = customPath;
    const dbPath = getDatabasePath();
    expect(dbPath).toBe(customPath);
    expect(fs.existsSync(path.dirname(customPath))).toBe(true);

    if (fs.existsSync(path.dirname(customPath))) {
      fs.rmSync(path.dirname(customPath), { recursive: true, force: true });
    }
  });

  it("initializes a real database on disk and applies schema", () => {
    const tempDbPath = path.join(process.cwd(), "data", "temp_init_test.db");
    const realDb = initDatabase(tempDbPath);
    expect(realDb).toBeDefined();

    const userTable = realDb
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
      .get();
    expect(userTable).toBeDefined();

    realDb.close();
    if (fs.existsSync(tempDbPath)) {
      fs.unlinkSync(tempDbPath);
    }
  });
});
