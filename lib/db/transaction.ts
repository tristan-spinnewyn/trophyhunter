// lib/db/transaction.ts
import type { DatabaseSync } from "node:sqlite";

let txDepth = 0;

export function withTransaction<T>(db: DatabaseSync, fn: () => T): T {
  const isOuter = txDepth === 0;
  const savepointName = `sp_${txDepth}`;
  txDepth++;

  if (isOuter) {
    db.exec("BEGIN");
  } else {
    db.exec(`SAVEPOINT ${savepointName}`);
  }

  try {
    const result = fn();
    if (isOuter) {
      db.exec("COMMIT");
    } else {
      db.exec(`RELEASE SAVEPOINT ${savepointName}`);
    }
    return result;
  } catch (err) {
    if (isOuter) {
      db.exec("ROLLBACK");
    } else {
      db.exec(`ROLLBACK TO SAVEPOINT ${savepointName}`);
    }
    throw err;
  } finally {
    txDepth--;
  }
}
