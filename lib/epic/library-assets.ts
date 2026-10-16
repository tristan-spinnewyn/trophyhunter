// lib/epic/library-assets.ts
const USER_AGENT = "UELauncher/11.0.1-14907503+++Portal+Release-Live Windows/10.0.19041.1.256.64bit";

export async function fetchLauncherAssets(accessToken: string): Promise<any[]> {
  try {
    const res = await fetch(
      "https://launcher-public-service-prod06.ol.epicgames.com/launcher/api/public/assets/Windows?label=Live",
      { headers: { Authorization: `Bearer ${accessToken}`, "User-Agent": USER_AGENT } }
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch {}
  return [];
}

export async function fetchEntitlements(accessToken: string, accountId: string): Promise<any[]> {
  try {
    const res = await fetch(
      `https://entitlement-public-service-prod08.ol.epicgames.com/entitlement/api/account/${accountId}/entitlements?start=0&count=5000`,
      { headers: { Authorization: `Bearer ${accessToken}`, "User-Agent": USER_AGENT } }
    );
    if (res.ok) {
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      return list
        .filter((ent: any) => ent.entitlementName && ent.namespace)
        .map((ent: any) => ({
          appName: ent.entitlementName,
          catalogItemId: ent.catalogItemId,
          catalogNamespace: ent.namespace,
          namespace: ent.namespace,
          title: ent.entitlementName,
        }));
    }
  } catch {}
  return [];
}
