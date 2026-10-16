import { NextResponse } from "next/server";

const normalize = (s: string) => s.replace(/[’']/g, "'").trim().toLowerCase();

// Safely sanitize HTML tags iteratively to prevent incomplete multi-character sanitization
function stripHtmlTags(input: string): string {
  let prev = input;
  let curr = input;
  do {
    prev = curr;
    curr = curr.replace(/<[^>]*>/g, "");
  } while (curr !== prev);
  return curr.trim();
}

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

  // Validate appId strictly as numeric digits to prevent SSRF
  if (!/^\d{1,10}$/.test(appId)) {
    return NextResponse.json(
      { error: "Paramètre 'appId' invalide (chiffres uniquement)." },
      { status: 400 }
    );
  }

  // Parse user input (supports vanity URL, SteamID64 or full URL)
  let userIdentifier = rawUser;
  let isVanity = true;

  const urlMatch = rawUser.match(
    /steamcommunity\.com\/(id|profiles)\/([a-zA-Z0-9_-]+)/i
  );
  if (urlMatch) {
    isVanity = urlMatch[1].toLowerCase() === "id";
    userIdentifier = urlMatch[2];
  } else if (/^\d{16,20}$/.test(rawUser)) {
    isVanity = false;
  }

  // Validate userIdentifier against strictly safe characters to prevent SSRF / path traversal
  if (isVanity) {
    if (!/^[a-zA-Z0-9_-]{2,64}$/.test(userIdentifier)) {
      return NextResponse.json(
        { error: "Pseudo ou identifiant Steam personnalisé invalide." },
        { status: 400 }
      );
    }
  } else {
    if (!/^\d{16,20}$/.test(userIdentifier)) {
      return NextResponse.json(
        { error: "SteamID64 invalide (16 à 20 chiffres attendus)." },
        { status: 400 }
      );
    }
  }

  const pathType = isVanity ? "id" : "profiles";
  const safeUser = encodeURIComponent(userIdentifier);
  const safeAppId = encodeURIComponent(appId);

  const xmlUrl = new URL(
    `https://steamcommunity.com/${pathType}/${safeUser}/stats/${safeAppId}/`
  );
  xmlUrl.searchParams.set("xml", "1");

  const schemaUrl = new URL(
    "https://api.steampowered.com/IPlayerService/GetGameAchievements/v1/"
  );
  schemaUrl.searchParams.set("appid", safeAppId);
  schemaUrl.searchParams.set("language", "french");

  const headers = {
    Cookie:
      "Steam_Language=french; mature_content=1; birthtime=568022401; lastagecheckage=1-January-1990",
    "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  };

  try {
    const [response, globalRes] = await Promise.all([
      fetch(xmlUrl.toString(), { headers, next: { revalidate: 30 } }),
      fetch(schemaUrl.toString(), { headers, next: { revalidate: 600 } }).catch(() => null),
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
      html.includes("Vous n'avez pas la permission de voir") ||
      html.includes("<privacyState>private</privacyState>") ||
      html.includes("<privacyState>friendsonly</privacyState>")
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
      html.includes("Profil introuvable") ||
      html.includes("<error>The specified profile could not be found")
    ) {
      return NextResponse.json(
        { error: `Profil introuvable. Avez-vous renseigné le bon SteamID ou pseudo personnalisé ?` },
        { status: 404 }
      );
    }

    let gameName = "";
    const unlockedTitles: string[] = [];
    const unlockedIds: string[] = [];
    let totalAchievements = 0;

    // Check if globalHtml is JSON schema from GetGameAchievements
    let schemaAchievements: any[] | null = null;
    try {
      const parsed = JSON.parse(globalHtml);
      if (Array.isArray(parsed?.response?.achievements)) {
        schemaAchievements = parsed.response.achievements;
      }
    } catch {
      // globalHtml is HTML (e.g. from mock tests)
    }

    // Check if response is XML
    if (html.includes("<playerstats>") || html.includes("<achievements>")) {
      const gnMatch = html.match(
        /<gameName><!\[CDATA\[(.*?)\]\]><\/gameName>|<gameName>(.*?)<\/gameName>/
      );
      if (gnMatch) gameName = gnMatch[1] || gnMatch[2] || "";

      const blocks = html.split(/<achievement\s+/).slice(1);
      const unlockedApis = new Set<string>();
      const unlockedNames = new Set<string>();
      const xmlAchievements: { api: string; name: string; isClosed: boolean }[] = [];

      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        const isClosed = block.includes('closed="1"') || block.includes("closed='1'");
        const apiMatch = block.match(
          /<apiname><!\[CDATA\[(.*?)\]\]><\/apiname>|<apiname>(.*?)<\/apiname>/
        );
        const nameMatch = block.match(
          /<name><!\[CDATA\[(.*?)\]\]><\/name>|<name>(.*?)<\/name>/
        );
        const api = (apiMatch ? apiMatch[1] || apiMatch[2] : "").trim();
        const name = (nameMatch ? nameMatch[1] || nameMatch[2] : `Succès #${i + 1}`).trim();

        xmlAchievements.push({ api, name, isClosed });

        if (isClosed) {
          if (api) unlockedApis.add(api.toLowerCase());
          if (name) unlockedNames.add(normalize(name));
        }
      }

      if (schemaAchievements && schemaAchievements.length > 0) {
        totalAchievements = schemaAchievements.length;
        for (let idx = 0; idx < schemaAchievements.length; idx++) {
          const ach = schemaAchievements[idx];
          const i = idx + 1;
          const title = ach.localized_name || ach.internal_name || `Succès #${i}`;
          const idSlug = `ach_${i}_${title.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 30)}`;
          const apiLower = (ach.internal_name || "").toLowerCase();

          const isUnlocked =
            unlockedApis.has(apiLower) ||
            unlockedNames.has(normalize(title)) ||
            unlockedNames.has(normalize(ach.internal_name || ""));

          if (isUnlocked) {
            unlockedIds.push(idSlug);
            unlockedTitles.push(title);
          }
        }
      } else {
        totalAchievements = xmlAchievements.length;
        for (let idx = 0; idx < xmlAchievements.length; idx++) {
          const ach = xmlAchievements[idx];
          const i = idx + 1;
          const idSlug = `ach_${i}_${ach.name.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 30)}`;
          if (ach.isClosed) {
            unlockedIds.push(idSlug);
            unlockedTitles.push(ach.name);
          }
        }
      }
    } else {
      // Legacy HTML parsing (supports unit test mocks and older Steam Community markup)
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

      const parts = html.split(/<div[^>]*class="[^"]*achieveRow[^"]*"[^>]*>/);
      for (let i = 1; i < parts.length; i++) {
        const chunk = parts[i];
        const titleMatch = chunk.match(/<h3[^>]*>(.*?)<\/h3>/);
        if (!titleMatch) continue;

        const title = stripHtmlTags(titleMatch[1]);
        const hasUnlockTime = chunk.includes("achieveUnlockTime");

        if (hasUnlockTime) {
          unlockedTitles.push(title);
        }
      }

      totalAchievements = Math.max(0, parts.length - 1);

      if (globalHtml) {
        const globalParts = globalHtml.split(/<div[^>]*class="[^"]*achieveRow[^"]*"[^>]*>/);
        if (globalParts.length > 1) {
          totalAchievements = globalParts.length - 1;
          const remainingUnlocked = [...unlockedTitles.map(normalize)];

          for (let i = 1; i < globalParts.length; i++) {
            const block = globalParts[i];
            const tMatch = block.match(/<h3[^>]*>(.*?)<\/h3>/);
            const title = tMatch ? stripHtmlTags(tMatch[1]) : `Succès #${i}`;
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
