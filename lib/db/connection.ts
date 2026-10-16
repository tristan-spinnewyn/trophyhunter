// lib/db/connection.ts
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { SCHEMA_SQL } from "./schema";

export { withTransaction } from "./transaction";

let dbInstance: DatabaseSync | null = null;

export function getDatabasePath(): string {
  if (process.env.DATABASE_PATH) {
    const customPath = process.env.DATABASE_PATH;
    const customDir = path.dirname(customPath);
    if (!fs.existsSync(customDir)) {
      try {
        fs.mkdirSync(customDir, { recursive: true });
      } catch {
        // Continue and let DatabaseSync report if inaccessible
      }
    }
    return customPath;
  }
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    try {
      fs.mkdirSync(dataDir, { recursive: true });
    } catch {
      // Continue and let DatabaseSync report if inaccessible
    }
  }
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
