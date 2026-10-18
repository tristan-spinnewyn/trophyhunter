// lib/db/connection.ts
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { SCHEMA_SQL } from "./schema";
import { runDatabaseMigrations } from "./migrations";

export { withTransaction } from "./transaction";

let dbInstance: DatabaseSync | null = null;

function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    try {
      fs.mkdirSync(dirPath, { recursive: true });
    } catch (err) {
      if (err instanceof Error && "code" in err && err.code === "EEXIST") return;
    }
  }
}

export function getDatabasePath(): string {
  if (process.env.DATABASE_PATH) {
    const customPath = process.env.DATABASE_PATH;
    ensureDirectoryExists(path.dirname(customPath));
    return customPath;
  }
  const dataDir = path.join(process.cwd(), "data");
  ensureDirectoryExists(dataDir);
  return path.join(dataDir, "trophyhunter.db");
}

export function initDatabase(dbPath?: string): DatabaseSync {
  const targetPath = dbPath || getDatabasePath();
  const db = new DatabaseSync(targetPath);

  try {
    db.exec("PRAGMA journal_mode = WAL;");
  } catch {
    db.exec("PRAGMA journal_mode = DELETE;");
  }
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec("PRAGMA busy_timeout = 5000;");

  db.exec(SCHEMA_SQL);
  runDatabaseMigrations(db);
  return db;
}

export function getDb(): DatabaseSync {
  if (!dbInstance) {
    dbInstance = initDatabase();
  }
  return dbInstance;
}

export function setDbForTesting(db: DatabaseSync | null): void {
  dbInstance = db;
}
