// ─── Fingerprint & Deduplication Engine ───────────────────────────────────

import { createHash } from "node:crypto";

/**
 * Computes a SHA-256 fingerprint from the raw file buffer or normalized text.
 */
export function computeDocumentFingerprint(buffer?: Buffer, text?: string): string {
  const hash = createHash("sha256");
  if (buffer && buffer.length > 0) {
    hash.update(buffer);
  } else if (text) {
    // Normalize whitespace for content-based hashing
    const normalized = text.toLowerCase().replace(/\s+/g, " ").trim();
    hash.update(normalized);
  } else {
    hash.update("empty-document");
  }
  return hash.digest("hex");
}

/**
 * Checks whether a given fingerprint or narrative already exists in an existing collection of reports or batch items.
 */
export function isDuplicateReport(
  fingerprint: string,
  rawText: string,
  existingFingerprints: Set<string>,
  existingTexts: string[]
): { isDuplicate: boolean; reason?: string } {
  if (existingFingerprints.has(fingerprint)) {
    return {
      isDuplicate: true,
      reason: "Identical document SHA-256 fingerprint already exists in the system or current batch.",
    };
  }

  const normalizedNew = rawText.toLowerCase().replace(/\s+/g, " ").trim();
  if (normalizedNew.length > 30) {
    for (const existing of existingTexts) {
      const normalizedExisting = existing.toLowerCase().replace(/\s+/g, " ").trim();
      if (normalizedNew === normalizedExisting) {
        return {
          isDuplicate: true,
          reason: "Identical narrative text already recorded in another safety report.",
        };
      }
    }
  }

  return { isDuplicate: false };
}
