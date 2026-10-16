// lib/storage/backup.ts
export function exportAllData(): string {
  if (typeof window === "undefined") return "{}";
  const data: Record<string, unknown> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith("trophyhunter_")) {
      try {
        data[key] = JSON.parse(localStorage.getItem(key) || "null");
      } catch {
        data[key] = localStorage.getItem(key);
      }
    }
  }
  return JSON.stringify(data, null, 2);
}

export function importAllData(jsonStr: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const data = JSON.parse(jsonStr);
    for (const key of Object.keys(data)) {
      if (key.startsWith("trophyhunter_")) {
        const val = typeof data[key] === "object" ? JSON.stringify(data[key]) : data[key];
        localStorage.setItem(key, val);
      }
    }
    return true;
  } catch (e) {
    console.error("Import failed:", e);
    return false;
  }
}

export function clearLegacyLocalStorage(): void {
  if (typeof window === "undefined") return;
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith("trophyhunter_")) {
      keysToRemove.push(k);
    }
  }
  for (const k of keysToRemove) {
    localStorage.removeItem(k);
  }
}
