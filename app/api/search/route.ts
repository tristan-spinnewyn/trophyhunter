import { NextResponse } from "next/server";
import type { GameSearchResult } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json({ games: [] });
  }

  try {
    const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(
      query
    )}&l=french&cc=fr`;

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
      },
      next: { revalidate: 300 }, // Cache search results for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`Steam search returned status ${response.status}`);
    }

    const data = await response.json();
    const items = data.items || [];

    const games: GameSearchResult[] = items.map((item: any) => ({
      id: item.id,
      name: item.name,
      img: item.tiny_image || `https://cdn.akamai.steamstatic.com/steam/apps/${item.id}/header.jpg`,
      price: item.price?.final
        ? `${(item.price.final / 100).toFixed(2)} €`
        : undefined,
    }));

    return NextResponse.json({ games });
  } catch (error: any) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Impossible de rechercher les jeux Steam.", details: error.message },
      { status: 500 }
    );
  }
}
