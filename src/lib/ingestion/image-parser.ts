// ─── Image & Scanned Safety Report Parser (OCR) ───────────────────────────

import { FileIngestionResult } from "./types";
import { computeDocumentFingerprint } from "./fingerprint";
import { recognizeImageBuffer } from "./ocr-engine";
import { createCanonicalSafetyEvent, extractMetadataFromNarrative } from "./normalizer";

/**
 * Parses scanned image documents (PNG, JPG, JPEG, WEBP) using Tesseract OCR.
 */
export async function parseImageDocument(
  buffer: Buffer,
  filename: string
): Promise<FileIngestionResult> {
  const warnings: string[] = [];
  const errors: string[] = [];
  const fingerprint = computeDocumentFingerprint(buffer);

  try {
    const ocrResult = await recognizeImageBuffer(buffer);
    const rawText = ocrResult.text.trim();

    if (!rawText || rawText.length === 0) {
      warnings.push("OCR did not detect any readable text in the image. Please verify image resolution or contrast.");
      return {
        file_id: `file-${Date.now()}`,
        filename,
        format: "image",
        status: "warning",
        pages_or_sheets_count: 1,
        rows_or_paragraphs_count: 0,
        extracted_text_length: 0,
        extraction_method: "ocr",
        extraction_confidence: 0.1,
        is_scanned: true,
        ocr_applied: true,
        ocr_confidence: 0,
        detected_metadata: { site: null, activity: null, reported_date: null, event_type: null },
        warnings,
        errors,
        fingerprint,
        canonical_events: [],
      };
    }

    if (ocrResult.confidence < 60) {
      warnings.push(`Low OCR confidence (${ocrResult.confidence}%). Text may contain transcription errors.`);
    }

    const meta = extractMetadataFromNarrative(rawText);
    const extractionConfidence = Number((ocrResult.confidence / 100).toFixed(2));

    const canonicalEvent = createCanonicalSafetyEvent({
      source_filename: filename,
      source_format: "image",
      raw_text: rawText,
      reported_date: meta.reported_date,
      site: meta.site,
      facility: meta.facility,
      activity: meta.activity,
      event_type: meta.event_type,
      source_row_or_page: "image scan",
      extraction_method: "ocr",
      extraction_confidence: extractionConfidence,
      metadata: {
        ocr_confidence: ocrResult.confidence,
        ocr_lines: ocrResult.linesCount,
        ocr_words: ocrResult.wordsCount,
      },
      provenanceList: [
        {
          field: "raw_text",
          value: rawText.slice(0, 100),
          source: `${filename} (OCR text)`,
          confidence: extractionConfidence,
        },
        ...(meta.site
          ? [
              {
                field: "site",
                value: meta.site,
                source: "OCR text header",
                evidence: meta.site,
                confidence: Number((extractionConfidence * 0.9).toFixed(2)),
              },
            ]
          : []),
        ...(meta.activity
          ? [
              {
                field: "activity",
                value: meta.activity,
                source: "OCR text header",
                evidence: meta.activity,
                confidence: Number((extractionConfidence * 0.9).toFixed(2)),
              },
            ]
          : []),
        ...(meta.reported_date
          ? [
              {
                field: "reported_date",
                value: meta.reported_date,
                source: "OCR text header",
                evidence: meta.reported_date,
                confidence: Number((extractionConfidence * 0.95).toFixed(2)),
              },
            ]
          : []),
      ],
    });

    return {
      file_id: `file-${Date.now()}`,
      filename,
      format: "image",
      status: ocrResult.confidence < 50 ? "warning" : "success",
      pages_or_sheets_count: 1,
      rows_or_paragraphs_count: ocrResult.linesCount,
      extracted_text_length: rawText.length,
      extraction_method: "ocr",
      extraction_confidence: extractionConfidence,
      is_scanned: true,
      ocr_applied: true,
      ocr_confidence: ocrResult.confidence,
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
      format: "image",
      status: "error",
      pages_or_sheets_count: 0,
      rows_or_paragraphs_count: 0,
      extracted_text_length: 0,
      extraction_method: "ocr",
      extraction_confidence: 0,
      is_scanned: true,
      ocr_applied: true,
      detected_metadata: { site: null, activity: null, reported_date: null, event_type: null },
      warnings,
      errors: [`OCR image processing failed: ${err?.message || "Corrupted image file"}`],
      fingerprint,
      canonical_events: [],
    };
  }
}
