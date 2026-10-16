export async function fetchEpicLibraryItems(
  accessToken: string
): Promise<any[]> {
  const rawItems: any[] = [];

  // 1. Query library-service (with cursor pagination)
  try {
    const libraryRes = await fetch(
      "https://library-service.live.use1a.on.epicgames.com/library/api/public/items?includeMetadata=true",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "User-Agent":
            "UELauncher/11.0.1-14907503+++Portal+Release-Live Windows/10.0.19041.1.256.64bit",
        },
      }
    );

    if (libraryRes.ok) {
      const libData = await libraryRes.json();
      const records: any[] = Array.isArray(libData)
        ? [...libData]
        : Array.isArray(libData?.records)
        ? [...libData.records]
        : [];

      let nextCursor =
        libData?.responseMetadata?.nextCursor ||
        libData?.nextCursor ||
        libData?.cursor;
      let pageCount = 0;
      const MAX_PAGES = 50; // Safety cap (up to ~2500 games)
      while (nextCursor && pageCount < MAX_PAGES) {
        pageCount++;
        try {
          const cursorParam = nextCursor.includes("%")
            ? nextCursor
            : encodeURIComponent(nextCursor);
          let nextRes = await fetch(
            `https://library-service.live.use1a.on.epicgames.com/library/api/public/items?includeMetadata=true&cursor=${cursorParam}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "User-Agent":
                  "UELauncher/11.0.1-14907503+++Portal+Release-Live Windows/10.0.19041.1.256.64bit",
              },
            }
          );

          if (!nextRes.ok && cursorParam !== nextCursor) {
            nextRes = await fetch(
              `https://library-service.live.use1a.on.epicgames.com/library/api/public/items?includeMetadata=true&cursor=${nextCursor}`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "User-Agent":
                    "UELauncher/11.0.1-14907503+++Portal+Release-Live Windows/10.0.19041.1.256.64bit",
                },
              }
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
          nextCursor =
            nextData?.responseMetadata?.nextCursor ||
            nextData?.nextCursor ||
            nextData?.cursor;
        } catch {
          break;
        }
      }

      rawItems.push(...records);
    }
  } catch {}

  // 2. Query launcher assets only if library-service returned nothing
  if (rawItems.length === 0) {
    try {
      const assetsRes = await fetch(
        "https://launcher-public-service-prod06.ol.epicgames.com/launcher/api/public/assets/Windows?label=Live",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "User-Agent":
              "UELauncher/11.0.1-14907503+++Portal+Release-Live Windows/10.0.19041.1.256.64bit",
          },
        }
      );

      if (assetsRes.ok) {
        const assetsData = await assetsRes.json();
        if (Array.isArray(assetsData)) {
          rawItems.push(...assetsData);
        }
      }
    } catch {}
  }

  return rawItems;
}
