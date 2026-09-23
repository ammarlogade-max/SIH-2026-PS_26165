// ─── DOCX / Word Safety Report Parser ──────────────────────────────────────

import mammoth from "mammoth";
import { FileIngestionResult, FieldProvenance } from "./types";
import { computeDocumentFingerprint } from "./fingerprint";
import { createCanonicalSafetyEvent, extractMetadataFromNarrative } from "./normalizer";

/**
 * Parses DOCX files extracting paragraphs, tables, and structured headings.
 */
export async function parseDocxDocument(
  buffer: Buffer,
  filename: string
): Promise<FileIngestionResult> {
  const warnings: string[] = [];
  const errors: string[] = [];
  const fingerprint = computeDocumentFingerprint(buffer);

  try {
    const rawResult = await mammoth.extractRawText({ buffer });
    const rawText = (rawResult.value || "").trim();

    if (!rawText || rawText.length === 0) {
      return {
        file_id: `file-${Date.now()}`,
        filename,
        format: "docx",
        status: "warning",
        pages_or_sheets_count: 1,
        rows_or_paragraphs_count: 0,
        extracted_text_length: 0,
        extraction_method: "docx_xml",
        extraction_confidence: 0.1,
        is_scanned: false,
        ocr_applied: false,
        detected_metadata: { site: null, activity: null, reported_date: null, event_type: null },
        warnings: ["Word document is empty or has no readable text."],
        errors,
        fingerprint,
        canonical_events: [],
      };
    }

    if (rawResult.messages && rawResult.messages.length > 0) {
      for (const msg of rawResult.messages) {
        if (msg.type === "warning") {
          warnings.push(`DOCX formatting notice: ${msg.message}`);
        }
      }
    }

    // Extract HTML representation to trace paragraphs and tables
    const htmlResult = await mammoth.convertToHtml({ buffer });
    const html = htmlResult.value || "";

    // Count paragraphs
    const paragraphs = rawText.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
    const paraCount = Math.max(1, paragraphs.length);

    // Metadata extraction (strict: no guessing)
    const meta = extractMetadataFromNarrative(rawText);

    // Build provenance
    const provenanceList: FieldProvenance[] = paragraphs.slice(0, 5).map((p, idx) => ({
      field: "raw_text",
      value: p.slice(0, 100),
      source: `paragraph ${idx + 1}`,
      confidence: 0.95,
    }));

    if (meta.site) {
      provenanceList.push({
        field: "site",
        value: meta.site,
        source: "DOCX body",
        evidence: meta.site,
        confidence: 0.92,
      });
    }

    if (meta.activity) {
      provenanceList.push({
        field: "activity",
        value: meta.activity,
        source: "DOCX body",
        evidence: meta.activity,
        confidence: 0.9,
      });
    }

    if (meta.reported_date) {
      provenanceList.push({
        field: "reported_date",
        value: meta.reported_date,
        source: "DOCX body",
        evidence: meta.reported_date,
        confidence: 0.95,
      });
    }

    const canonicalEvent = createCanonicalSafetyEvent({
      source_filename: filename,
      source_format: "docx",
      raw_text: rawText,
      reported_date: meta.reported_date,
      site: meta.site,
      facility: meta.facility,
      activity: meta.activity,
      event_type: meta.event_type,
      source_row_or_page: `${paraCount} paragraphs`,
      extraction_method: "docx_xml",
      extraction_confidence: 0.95,
      metadata: {
        paragraphs_count: paraCount,
        has_html_tables: html.includes("<table"),
      },
      provenanceList,
    });

    return {
      file_id: `file-${Date.now()}`,
      filename,
      format: "docx",
      status: "success",
      pages_or_sheets_count: 1,
      rows_or_paragraphs_count: paraCount,
      extracted_text_length: rawText.length,
      extraction_method: "docx_xml",
      extraction_confidence: 0.95,
      is_scanned: false,
      ocr_applied: false,
      detected_metadata: meta,
      warnings,
      errors,
      fingerprint,
      canonical_events: [canonicalEvent],
    };
  } catch (err: any) {
    return {
      file_id: `file-${Date.now()}`,
      filename,
      format: "docx",
      status: "error",
      pages_or_sheets_count: 0,
      rows_or_paragraphs_count: 0,
      extracted_text_length: 0,
      extraction_method: "docx_xml",
      extraction_confidence: 0,
      is_scanned: false,
      ocr_applied: false,
      detected_metadata: { site: null, activity: null, reported_date: null, event_type: null },
      warnings,
      errors: [`Malformed Word document: ${err?.message || "Invalid XML archive"}`],
      fingerprint,
      canonical_events: [],
    };
  }
}
