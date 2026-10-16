// lib/epic/library-service.ts
const USER_AGENT = "UELauncher/11.0.1-14907503+++Portal+Release-Live Windows/10.0.19041.1.256.64bit";

export async function fetchLibraryServiceItems(accessToken: string): Promise<any[]> {
  const records: any[] = [];
  try {
    const libraryRes = await fetch(
      "https://library-service.live.use1a.on.epicgames.com/library/api/public/items?includeMetadata=true",
      { headers: { Authorization: `Bearer ${accessToken}`, "User-Agent": USER_AGENT } }
    );
    if (!libraryRes.ok) return [];

    const libData = await libraryRes.json();
    if (Array.isArray(libData)) records.push(...libData);
    else if (Array.isArray(libData?.records)) records.push(...libData.records);

    let nextCursor = libData?.responseMetadata?.nextCursor || libData?.nextCursor || libData?.cursor;
    let pageCount = 0;
    const MAX_PAGES = 50;

    while (nextCursor && pageCount < MAX_PAGES) {
      pageCount++;
      try {
        const cursorParam = nextCursor.includes("%") ? nextCursor : encodeURIComponent(nextCursor);
        let nextRes = await fetch(
          `https://library-service.live.use1a.on.epicgames.com/library/api/public/items?includeMetadata=true&cursor=${cursorParam}`,
          { headers: { Authorization: `Bearer ${accessToken}`, "User-Agent": USER_AGENT } }
        );

        if (!nextRes.ok && cursorParam !== nextCursor) {
          nextRes = await fetch(
            `https://library-service.live.use1a.on.epicgames.com/library/api/public/items?includeMetadata=true&cursor=${nextCursor}`,
            { headers: { Authorization: `Bearer ${accessToken}`, "User-Agent": USER_AGENT } }
          );
        }

        if (!nextRes.ok) break;
        const nextData = await nextRes.json();
        const nextRecords = Array.isArray(nextData)
          ? nextData
          : Array.isArray(nextData?.records)
          ? nextData.records
          : [];
        if (nextRecords.length === 0) break;
        records.push(...nextRecords);
        nextCursor = nextData?.responseMetadata?.nextCursor || nextData?.nextCursor || nextData?.cursor;
      } catch {
        break;
      }
    }
  } catch {}
  return records;
}
