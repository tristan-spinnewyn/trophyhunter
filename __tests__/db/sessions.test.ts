// __tests__/db/sessions.test.ts
import crypto from "node:crypto";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  initDatabase,
  setDbForTesting,
  createUser,
  createSession,
  validateSession,
  deleteSession,
  getUserById,
} from "@/lib/db";
import { getDb } from "@/lib/db/connection";
import { runDatabaseMigrations } from "@/lib/db/migrations";

describe("Database Sessions", () => {
  beforeEach(() => {
    setDbForTesting(initDatabase(":memory:"));
  });

  afterEach(() => {
    setDbForTesting(null);
  });

  it("manages user sessions with expiration and deletion", () => {
    const user = createUser("SessionUser", "password123");
    const sessionId = createSession(user.id);
    expect(sessionId).toBeDefined();

    const sessionUser = validateSession(sessionId);
    expect(sessionUser).not.toBeNull();
    expect(sessionUser?.id).toBe(user.id);

    const byId = getUserById(user.id);
    expect(byId?.username).toBe("sessionuser");

    deleteSession(sessionId);
    expect(validateSession(sessionId)).toBeNull();
    expect(validateSession("")).toBeNull();
    expect(validateSession("nonexistent-token")).toBeNull();
  });
  it("stores only a hash of the session token, so a copy of the database cannot be replayed as a cookie", () => {
    const user = createUser("HashUser", "password123");
    const token = createSession(user.id);

    const rows = getDb().prepare("SELECT token_hash FROM sessions").all() as { token_hash: string }[];
    expect(rows).toHaveLength(1);
    expect(rows[0].token_hash).not.toBe(token);
    expect(rows[0].token_hash).toBe(crypto.createHash("sha256").update(token).digest("hex"));
    expect(JSON.stringify(rows)).not.toContain(token);

    expect(validateSession(token)?.id).toBe(user.id);
    expect(validateSession(rows[0].token_hash)).toBeNull();

    deleteSession(token);
    expect(getDb().prepare("SELECT COUNT(*) AS n FROM sessions").get()).toEqual({ n: 0 });
  });

  it("rejects and removes an expired session", () => {
    const user = createUser("ExpiredUser", "password123");
    const token = createSession(user.id);
    getDb().prepare("UPDATE sessions SET expires_at = ?").run("2000-01-01T00:00:00.000Z");

    expect(validateSession(token)).toBeNull();
    expect(getDb().prepare("SELECT COUNT(*) AS n FROM sessions").get()).toEqual({ n: 0 });
  });

  it("drops sessions stored with a plain token by an earlier version", () => {
    const db = getDb();
    const user = createUser("LegacyUser", "password123");
    db.exec("DROP TABLE sessions;");
    db.exec("CREATE TABLE sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires_at TEXT NOT NULL, created_at TEXT NOT NULL);");
    db.prepare("INSERT INTO sessions VALUES (?, ?, ?, ?)").run("plain-token", user.id, "2999-01-01T00:00:00.000Z", "2026-01-01T00:00:00.000Z");

    runDatabaseMigrations(db);

    const columns = (db.prepare("PRAGMA table_info(sessions)").all() as { name: string }[]).map((c) => c.name);
    expect(columns).toContain("token_hash");
    expect(columns).not.toContain("id");
    expect(validateSession("plain-token")).toBeNull();
    expect(validateSession(createSession(user.id))?.id).toBe(user.id);
  });
});
