// lib/steam/html.ts
// Client-safe helpers to read text out of Steam HTML and XML pages.

export const HTML_ENTITIES: Record<string, string> = {
  "&nbsp;": " ",
  "&quot;": '"',
  "&#39;": "'",
  "&lt;": "<",
  "&gt;": ">",
  "&amp;": "&",
};

export function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&(?:nbsp|quot|#39|lt|gt|amp);/g, (match) => HTML_ENTITIES[match] || match)
    .trim();
}

export function stripHtmlTags(input: string): string {
  let prev = input;
  let curr = input;
  do {
    prev = curr;
    curr = curr.replace(/<[^>]*>/g, "");
  } while (curr !== prev);
  return curr.trim();
}

export function parseXmlTag(xml: string, tag: string): string {
  const m = xml.match(
    new RegExp(`<${tag}><!\\[CDATA\\[(.*?)\\]\\]><\\/${tag}>|<${tag}>(.*?)<\\/${tag}>`, "s")
  );
  return m ? (m[1] ?? m[2] ?? "").trim() : "";
}
