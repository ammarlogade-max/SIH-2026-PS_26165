// ─── Plain Text & RTF Safety Report Parser ──────────────────────────────────

import { FileIngestionResult } from "./types";
import { computeDocumentFingerprint } from "./fingerprint";
import { createCanonicalSafetyEvent, extractMetadataFromNarrative } from "./normalizer";

/**
 * Strips RTF control codes into plain text.
 */
function stripRtf(rtf: string): string {
  return rtf
    .replace(/\\par[d]?/g, "\n")
    .replace(/\\line/g, "\n")
    .replace(/\\tab/g, "\t")
    .replace(/\\'[0-9a-fA-F]{2}/g, " ")
    .replace(/\\[a-zA-Z]+(-?[0-9]+)? ?/g, "")
    .replace(/[{}]/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\n\s*\n/g, "\n\n")
    .trim();
}

/**
 * Parses TXT and RTF documents.
 */
export async function parseTextDocument(
  buffer: Buffer,
  filename: string
): Promise<FileIngestionResult> {
  const warnings: string[] = [];
  const errors: string[] = [];
  const fingerprint = computeDocumentFingerprint(buffer);

  const isRtf = filename.toLowerCase().endsWith(".rtf");
  const rawContent = buffer.toString("utf-8");
  const text = isRtf ? stripRtf(rawContent) : rawContent.trim();

  if (!text || text.length === 0) {
    return {
      file_id: `file-${Date.now()}`,
      filename,
      format: isRtf ? "rtf" : "txt",
      status: "warning",
      pages_or_sheets_count: 1,
      rows_or_paragraphs_count: 0,
      extracted_text_length: 0,
      extraction_method: isRtf ? "rtf_strip" : "text_plain",
      extraction_confidence: 0.1,
      is_scanned: false,
      ocr_applied: false,
      detected_metadata: { site: null, activity: null, reported_date: null, event_type: null },
      warnings: ["Text file contains no characters."],
      errors,
      fingerprint,
      canonical_events: [],
    };
  }

  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  const meta = extractMetadataFromNarrative(text);

  const canonicalEvent = createCanonicalSafetyEvent({
    source_filename: filename,
    source_format: isRtf ? "rtf" : "txt",
    raw_text: text,
    reported_date: meta.reported_date,
    site: meta.site,
    facility: meta.facility,
    activity: meta.activity,
    event_type: meta.event_type,
    source_row_or_page: `${lines.length} lines`,
    extraction_method: isRtf ? "rtf_strip" : "text_plain",
    extraction_confidence: 0.98,
    metadata: {
      total_lines: lines.length,
      format_subtype: isRtf ? "rtf" : "plain_text",
    },
    provenanceList: [
      {
        field: "raw_text",
        value: text.slice(0, 100),
        source: `${filename} (plain text stream)`,
        confidence: 0.98,
      },
      ...(meta.site
        ? [
            {
              field: "site",
              value: meta.site,
              source: "text header line",
              evidence: meta.site,
              confidence: 0.95,
            },
          ]
        : []),
      ...(meta.activity
        ? [
            {
              field: "activity",
              value: meta.activity,
              source: "text header line",
              evidence: meta.activity,
              confidence: 0.92,
            },
          ]
        : []),
      ...(meta.reported_date
        ? [
            {
              field: "reported_date",
              value: meta.reported_date,
              source: "text header line",
              evidence: meta.reported_date,
              confidence: 0.98,
            },
          ]
        : []),
    ],
  });

  return {
    file_id: `file-${Date.now()}`,
    filename,
    format: isRtf ? "rtf" : "txt",
    status: "success",
    pages_or_sheets_count: 1,
    rows_or_paragraphs_count: lines.length,
    extracted_text_length: text.length,
    extraction_method: isRtf ? "rtf_strip" : "text_plain",
    extraction_confidence: 0.98,
    is_scanned: false,
    ocr_applied: false,
    detected_metadata: meta,
    warnings,
    errors,
    fingerprint,
    canonical_events: [canonicalEvent],
  };
}
