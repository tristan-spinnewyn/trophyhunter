// components/library/hooks/collectionApi.ts

import type { PlatformType } from "@/lib/types";

export async function createCollectionApi(name: string, description?: string): Promise<string | null> {
  try {
    const res = await fetch("/api/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, color: "#6366f1" }),
    });
    if (res.ok) {
      const data = await res.json();
      return data?.collection?.id || null;
    }
  } catch {}
  return null;
}

export async function deleteCollectionApi(collId: string): Promise<void> {
  try {
    await fetch(`/api/collections/${collId}`, { method: "DELETE" });
  } catch {}
}

export async function addGameToCollectionApi(collId: string, appId: number, platform: PlatformType): Promise<void> {
  try {
    await fetch(`/api/collections/${collId}/games`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appId, platform }),
    });
  } catch {}
}

export async function removeGameFromCollectionApi(collId: string, appId: number, platform: PlatformType): Promise<void> {
  try {
    await fetch(`/api/collections/${collId}/games?appId=${appId}&platform=${platform}`, { method: "DELETE" });
  } catch {}
}
