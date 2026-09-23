// ─── Format Detector for Safety Documents ────────────────────────────────

import { IngestionSourceFormat } from "./types";

export interface FormatDetectionResult {
  format: IngestionSourceFormat;
  mimeType?: string;
  isSupported: boolean;
  unsupportedReason?: string;
}

export const SUPPORTED_EXTENSIONS = [
  ".pdf",
  ".docx",
  ".doc",
  ".xlsx",
  ".xls",
  ".csv",
  ".tsv",
  ".txt",
  ".rtf",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
];

/**
 * Detects format using both filename extension and buffer magic headers.
 */
export function detectDocumentFormat(filename: string, buffer?: Buffer): FormatDetectionResult {
  const lowerName = filename.toLowerCase().trim();
  const ext = lowerName.includes(".") ? `.${lowerName.split(".").pop()}` : "";

  // 1. Magic byte inspection if buffer available
  if (buffer && buffer.length >= 4) {
    // PDF: %PDF- (0x25 0x50 0x44 0x46)
    if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
      return { format: "pdf", mimeType: "application/pdf", isSupported: true };
    }

    // PNG: \x89PNG (0x89 0x50 0x4E 0x47)
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
      return { format: "image", mimeType: "image/png", isSupported: true };
    }

    // JPEG: 0xFF 0xD8 0xFF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return { format: "image", mimeType: "image/jpeg", isSupported: true };
    }

    // WEBP: RIFF....WEBP
    if (
      buffer.length >= 12 &&
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP"
    ) {
      return { format: "image", mimeType: "image/webp", isSupported: true };
    }

    // RTF: {\rtf
    if (buffer.length >= 5 && buffer.toString("ascii", 0, 5) === "{\\rtf") {
      return { format: "rtf", mimeType: "application/rtf", isSupported: true };
    }

    // ZIP based formats: PK\x03\x04 (0x50 0x4B 0x03 0x04) -> DOCX or XLSX
    if (buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04) {
      if (ext === ".xlsx") {
        return { format: "xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", isSupported: true };
      }
      if (ext === ".docx") {
        return { format: "docx", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", isSupported: true };
      }
      // Inspect buffer contents for xl/ or word/
      const sample = buffer.toString("ascii", 0, Math.min(buffer.length, 2048));
      if (sample.includes("xl/") || sample.includes("workbook")) {
        return { format: "xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", isSupported: true };
      }
      if (sample.includes("word/") || sample.includes("document")) {
        return { format: "docx", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", isSupported: true };
      }
    }

    // OLE2 Compound Document (DOC or XLS): 0xD0 0xCF 0x11 0xE0
    if (buffer[0] === 0xd0 && buffer[1] === 0xcf && buffer[2] === 0x11 && buffer[3] === 0xe0) {
      if (ext === ".xls") {
        return { format: "xls", mimeType: "application/vnd.ms-excel", isSupported: true };
      }
      return { format: "doc", mimeType: "application/msword", isSupported: true };
    }
  }

  // 2. Fallback to extension mapping
  switch (ext) {
    case ".pdf":
      return { format: "pdf", mimeType: "application/pdf", isSupported: true };
    case ".docx":
      return { format: "docx", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", isSupported: true };
    case ".doc":
      return { format: "doc", mimeType: "application/msword", isSupported: true };
    case ".xlsx":
      return { format: "xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", isSupported: true };
    case ".xls":
      return { format: "xls", mimeType: "application/vnd.ms-excel", isSupported: true };
    case ".csv":
      return { format: "csv", mimeType: "text/csv", isSupported: true };
    case ".tsv":
      return { format: "tsv", mimeType: "text/tab-separated-values", isSupported: true };
    case ".txt":
      return { format: "txt", mimeType: "text/plain", isSupported: true };
    case ".rtf":
      return { format: "rtf", mimeType: "application/rtf", isSupported: true };
    case ".png":
    case ".jpg":
    case ".jpeg":
    case ".webp":
      return { format: "image", mimeType: `image/${ext.replace(".", "")}`, isSupported: true };
    default:
      return {
        format: "unsupported",
        isSupported: false,
        unsupportedReason: `Unsupported file type '${ext || "unknown"}'. Accepted formats: PDF, Word (.docx, .doc), Excel (.xlsx, .xls), CSV, TSV, Plain Text (.txt), RTF, and Scanned Images (.png, .jpg, .webp).`,
      };
  }
}
