// lib/storage/collections.ts
import { COLLECTIONS_KEY } from "./constants";

export interface LocalCollection {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  gameIds: number[];
}

export function getLocalCollections(): LocalCollection[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(COLLECTIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalCollections(colls: LocalCollection[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(colls));
}
