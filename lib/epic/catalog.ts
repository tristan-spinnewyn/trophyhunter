import { extractBestCover } from "./helpers";

export async function batchResolveCatalogTitlesAndImages(
  namespaceMap: Map<string, string[]>,
  accessToken: string
): Promise<Map<string, { title: string; image: string }>> {
  const catalogTitles = new Map<string, { title: string; image: string }>();
  const nsEntries = Array.from(namespaceMap.entries());
  const BATCH_SIZE = 10;

  for (let i = 0; i < nsEntries.length; i += BATCH_SIZE) {
    const chunk = nsEntries.slice(i, i + BATCH_SIZE);
    await Promise.all(
      chunk.map(async ([ns, ids]) => {
        try {
          const queryIds = ids
            .map((id) => `id=${encodeURIComponent(id)}`)
            .join("&");
          const cRes = await fetch(
            `https://catalog-public-service-prod06.ol.epicgames.com/catalog/api/shared/namespace/${ns}/bulk/items?${queryIds}&includeDLCDetails=true&includeMainGameDetails=true&country=FR&locale=fr-FR`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "User-Agent":
                  "EpicGamesLauncher/14.0.8-22004686+++Portal+Release-Live",
              },
            }
          );
          if (cRes.ok) {
            const cData = await cRes.json();
            const items = Array.isArray(cData) ? cData : Object.values(cData);
            for (const it of items as any[]) {
              const itId = it?.id;
              const itTitle = it?.title || it?.name;
              if (itId && itTitle) {
                const imgUrl = extractBestCover(
                  it.keyImages,
                  it.customAttributes
                );
                catalogTitles.set(itId, { title: itTitle, image: imgUrl });
              }
            }
          }
        } catch {}
      })
    );
  }

  return catalogTitles;
}
