// lib/epic/sandbox-matcher.ts
import { normalizeGameTitle } from "../db/collections";

export function matchSandboxRecord(
  records: any[],
  normTitle: string,
  knownSandbox?: string | null
): any | null {
  for (const rec of records) {
    const sId = (rec.sandboxId || "").toLowerCase();
    const cleanSid = sId
      .replace(/^ns_?/, "")
      .replace(/_?sandbox$/, "")
      .replace(/[^a-z0-9]/g, "");

    const recProductName = (rec.productName || "").trim();
    const normRecProduct = normalizeGameTitle(recProductName);

    if (
      (knownSandbox && sId === knownSandbox.toLowerCase()) ||
      cleanSid === normTitle ||
      (normTitle.length >= 4 && cleanSid.startsWith(normTitle)) ||
      (cleanSid.length >= 4 && normTitle.startsWith(cleanSid)) ||
      (normRecProduct && normRecProduct === normTitle) ||
      (normRecProduct.length >= 4 && normTitle.includes(normRecProduct)) ||
      (normTitle.length >= 4 && normRecProduct.includes(normTitle))
    ) {
      return rec;
    }
  }
  return null;
}
