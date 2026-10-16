import { NextResponse } from "next/server";

const normalize = (s: string) => s.replace(/[’']/g, "'").trim().toLowerCase();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawUser = searchParams.get("user")?.trim();
  const appId = searchParams.get("appId")?.trim();

  if (!rawUser || !appId) {
    return NextResponse.json(
      { error: "Paramètres 'user' et 'appId' requis." },
      { status: 400 }
    );
  }

  // Parse user input (supports vanity URL, SteamID64 or full URL)
  let userIdentifier = rawUser;
  let isVanity = true;

  const urlMatch = rawUser.match(
    /steamcommunity\.com\/(id|profiles)\/([^\s/?#]+)/i
  );
  if (urlMatch) {
    isVanity = urlMatch[1].toLowerCase() === "id";
    userIdentifier = urlMatch[2];
  } else if (/^\d{16,20}$/.test(rawUser)) {
    isVanity = false;
  }

  const pathType = isVanity ? "id" : "profiles";
  const profileUrl = `https://steamcommunity.com/${pathType}/${encodeURIComponent(
    userIdentifier
  )}/stats/${appId}/achievements/?l=french`;
  const globalStatsUrl = `https://steamcommunity.com/stats/${appId}/achievements/?l=french`;

  const headers = {
    Cookie:
      "Steam_Language=french; mature_content=1; birthtime=568022401; lastagecheckage=1-January-1990",
    "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  };

  try {
    const [response, globalRes] = await Promise.all([
      fetch(profileUrl, { headers, next: { revalidate: 30 } }),
      fetch(globalStatsUrl, { headers, next: { revalidate: 600 } }).catch(() => null),
    ]);

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: `Profil Steam introuvable pour "${rawUser}". Vérifiez l'ID ou le pseudo.` },
          { status: 404 }
        );
      }
      throw new Error(`Erreur Steam (${response.status})`);
    }

    const html = await response.text();
    const globalHtml = globalRes && globalRes.ok ? await globalRes.text() : "";

    // Check if profile is private
    if (
      html.includes("Ce profil est privé") ||
      html.includes("This profile is private") ||
      html.includes("profile_private_info") ||
      html.includes("Vous n'avez pas la permission de voir")
    ) {
      return NextResponse.json(
        {
          error:
            "Ce profil Steam (ou ses Détails des jeux) est en privé. Pour synchroniser sans clé, passez les 'Détails des jeux' en Public dans vos paramètres de confidentialité Steam.",
          isPrivate: true,
        },
        { status: 403 }
      );
    }

    if (
      html.includes("The specified profile could not be found") ||
      html.includes("Profil introuvable")
    ) {
      return NextResponse.json(
        { error: `Profil introuvable. Avez-vous renseigné le bon SteamID ou pseudo personnalisé ?` },
        { status: 404 }
      );
    }

    // Extract game title from <title>Communauté Steam :: GameName :: User :: Succès</title>
    let gameName = "";
    const pageTitleMatch = html.match(/<title>(.*?)<\/title>/i);
    if (pageTitleMatch) {
      const segs = pageTitleMatch[1]
        .replace(/&nbsp;/g, " ")
        .split("::")
        .map((s) => s.trim());
      if (segs.length >= 3) {
        gameName = segs[1];
      }
    }

    // Split HTML by achieveRow blocks for bulletproof parsing
    const parts = html.split(/<div[^>]*class="[^"]*achieveRow[^"]*"[^>]*>/);
    const unlockedTitles: string[] = [];

    for (let i = 1; i < parts.length; i++) {
      const chunk = parts[i];
      const titleMatch = chunk.match(/<h3[^>]*>(.*?)<\/h3>/);
      if (!titleMatch) continue;

      const title = titleMatch[1].replace(/<[^>]+>/g, "").trim();
      const hasUnlockTime = chunk.includes("achieveUnlockTime");

      if (hasUnlockTime) {
        unlockedTitles.push(title);
      }
    }

    // Compute exact deterministic unlockedIds matching /api/game/[id]
    const unlockedIds: string[] = [];
    let totalAchievements = Math.max(0, parts.length - 1);

    if (globalHtml) {
      const globalParts = globalHtml.split(/<div[^>]*class="[^"]*achieveRow[^"]*"[^>]*>/);
      if (globalParts.length > 1) {
        totalAchievements = globalParts.length - 1;
        const remainingUnlocked = [...unlockedTitles.map(normalize)];

        for (let i = 1; i < globalParts.length; i++) {
          const block = globalParts[i];
          const tMatch = block.match(/<h3[^>]*>(.*?)<\/h3>/);
          const title = tMatch ? tMatch[1].replace(/<[^>]+>/g, "").trim() : `Succès #${i}`;
          const normTitle = normalize(title);
          const idx = remainingUnlocked.indexOf(normTitle);
          if (idx !== -1) {
            const idSlug = `ach_${i}_${title.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 30)}`;
            unlockedIds.push(idSlug);
            remainingUnlocked.splice(idx, 1);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      user: userIdentifier,
      isVanity,
      gameName: gameName || undefined,
      headerImg: `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`,
      totalAchievements,
      unlockedTitles,
      unlockedIds,
      count: unlockedTitles.length,
    });
  } catch (error: any) {
    console.error("Sync API error:", error);
    return NextResponse.json(
      { error: "Impossible de synchroniser avec le profil Steam.", details: error.message },
      { status: 500 }
    );
  }
}
