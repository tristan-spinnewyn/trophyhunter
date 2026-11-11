// lib/backup/weekly-backup-job.ts
// A backup file per user, written once a week next to the database, the latest few kept.

import fs from "node:fs";
import path from "node:path";
import { getDatabasePath, listUserIds } from "@/lib/db";
import { buildBackup } from "./backup-export.services";

/** How many weekly files are kept per user. */
export const KEPT_BACKUPS = 8;

const WEEK_MS = 7 * 24 * 3_600_000;
const FILE_PATTERN = /^trophyhunter-(\d{4}-\d{2}-\d{2})\.json$/;

/** Where the weekly backups live: a `backups` folder next to the database file. */
export function defaultBackupDir(): string {
  return path.join(path.dirname(getDatabasePath()), "backups");
}

/** The user's backup files, oldest first. */
function backupFiles(userDir: string): string[] {
  if (!fs.existsSync(userDir)) return [];
  return fs.readdirSync(userDir).filter((f) => FILE_PATTERN.test(f)).sort();
}

function isDue(files: readonly string[], now: Date): boolean {
  const latest = files.at(-1)?.match(FILE_PATTERN)?.[1];
  return !latest || now.getTime() - Date.parse(`${latest}T00:00:00.000Z`) >= WEEK_MS - 24 * 3_600_000 / 2;
}

/** Writes a backup for every user whose latest one is a week old, then drops the oldest beyond KEPT_BACKUPS. */
export async function writeWeeklyBackups(now: Date, dir: string = defaultBackupDir()): Promise<number> {
  let written = 0;
  for (const userId of listUserIds()) {
    const userDir = path.join(dir, userId);
    if (!isDue(backupFiles(userDir), now)) continue;

    fs.mkdirSync(userDir, { recursive: true });
    const file = path.join(userDir, `trophyhunter-${now.toISOString().slice(0, 10)}.json`);
    fs.writeFileSync(file, JSON.stringify(buildBackup(userId, now)), "utf8");
    written += 1;

    const files = backupFiles(userDir);
    for (const old of files.slice(0, Math.max(0, files.length - KEPT_BACKUPS))) fs.rmSync(path.join(userDir, old));
  }
  return written;
}
