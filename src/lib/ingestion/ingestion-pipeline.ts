// ─── SIF Sentinel Master Ingestion Pipeline (SIH26165) ─────────────────────

import { detectDocumentFormat } from "./detector";
import { computeDocumentFingerprint } from "./fingerprint";
import { parsePdfDocument } from "./pdf-parser";
import { parseDocxDocument } from "./docx-parser";
import { parseSpreadsheetDocument } from "./spreadsheet-parser";
import { parseTextDocument } from "./text-parser";
import { parseImageDocument } from "./image-parser";
import {
  FileIngestionResult,
  CanonicalSafetyEvent,
  BatchIngestionCommitResult,
  IngestionSourceFormat,
} from "./types";
import { Report, Classification, normalizeSafetyEventType } from "@/lib/types";
import { generateLayerAClassification } from "@/lib/layer-a-classifier";
import { generateReasoningNarrative } from "@/lib/narrative-engine";
import { appendSafetyRecords, getSafetySnapshot } from "@/lib/safety-store";
import { computeAggregates } from "@/lib/aggregation-engine";

export interface IngestionOptions {
  forcedSheetName?: string;
  overrideColumnMapping?: Record<string, string>;
  existingFingerprints?: Set<string>;
  existingNarratives?: string[];
  allowDuplicates?: boolean;
}

/**
 * Parses any uploaded safety report document into canonical safety events.
 * Never crashes on invalid or unsupported files.
 */
export async function parseUploadedDocument(
  buffer: Buffer,
  filename: string,
  options?: IngestionOptions
): Promise<FileIngestionResult> {
  const detection = detectDocumentFormat(filename, buffer);

  // 1. Handle unsupported file types gracefully
  if (!detection.isSupported) {
    return {
      file_id: `file-${Date.now()}`,
      filename,
      format: "unsupported",
      status: "unsupported",
      pages_or_sheets_count: 0,
      rows_or_paragraphs_count: 0,
      extracted_text_length: 0,
      extraction_method: "fallback",
      extraction_confidence: 0,
      is_scanned: false,
      ocr_applied: false,
      detected_metadata: { site: null, activity: null, reported_date: null, event_type: null },
      warnings: [],
      errors: [
        detection.unsupportedReason ||
          `Unsupported file format for '${filename}'. Accepted formats: PDF, Word (.docx, .doc), Excel (.xlsx, .xls), CSV, TSV, Plain Text (.txt), RTF, and Scanned Images (.png, .jpg, .webp).`,
      ],
      fingerprint: computeDocumentFingerprint(buffer),
      canonical_events: [],
    };
  }

  // 2. Dispatch to specific format parser
  let result: FileIngestionResult;

  switch (detection.format) {
    case "pdf":
      result = await parsePdfDocument(buffer, filename);
      break;

    case "docx":
    case "doc":
      result = await parseDocxDocument(buffer, filename);
      break;

    case "xlsx":
    case "xls":
    case "csv":
    case "tsv":
      result = await parseSpreadsheetDocument(buffer, filename, {
        forcedSheetName: options?.forcedSheetName,
        overrideColumnMapping: options?.overrideColumnMapping,
      });
      break;

    case "txt":
    case "rtf":
      result = await parseTextDocument(buffer, filename);
      break;

    case "image":
      result = await parseImageDocument(buffer, filename);
      break;

    default:
      result = {
        file_id: `file-${Date.now()}`,
        filename,
        format: "unknown",
        status: "unsupported",
        pages_or_sheets_count: 0,
        rows_or_paragraphs_count: 0,
        extracted_text_length: 0,
        extraction_method: "fallback",
        extraction_confidence: 0,
        is_scanned: false,
        ocr_applied: false,
        detected_metadata: { site: null, activity: null, reported_date: null, event_type: null },
        warnings: [],
        errors: [`Unrecognized document structure for '${filename}'.`],
        fingerprint: computeDocumentFingerprint(buffer),
        canonical_events: [],
      };
  }

  // 3. Duplicate detection check
  if (options?.existingFingerprints && options.existingFingerprints.has(result.fingerprint)) {
    result.is_duplicate = true;
    result.duplicate_details = "A safety document with this exact SHA-256 fingerprint has already been processed.";
    result.warnings.push("Duplicate document detected: SHA-256 fingerprint matches an existing file.");
    if (!options.allowDuplicates) {
      result.status = "warning";
    }
  }

  return result;
}

/**
 * Bridges canonical safety events into the existing SIF Sentinel analysis pipeline.
 * Passes events through ML classification, Campbell gates, CSRA energy wheel,
 * IOGP Life-Saving Rules, reasoning engine, and safety persistence store.
 */
export async function commitCanonicalEventsToPipeline(
  events: CanonicalSafetyEvent[],
  auditInfo?: { actor_name: string; actor_role: any; details?: string }
): Promise<BatchIngestionCommitResult> {
  const reportsToSave: Report[] = [];
  const classificationsToSave: Classification[] = [];

  const processedFilesMap = new Map<
    string,
    { filename: string; format: IngestionSourceFormat; count: number; method: string; ocr: boolean }
  >();

  const ruleDistribution: Record<string, number> = {};
  let sifCount = 0;
  let nonSifCount = 0;

  for (const event of events) {
    if (!event.raw_text || event.raw_text.trim().length === 0) continue;

    // Track file summaries
    const fileKey = event.source_filename;
    const existingFileTrack = processedFilesMap.get(fileKey) || {
      filename: event.source_filename,
      format: event.source_format,
      count: 0,
      method: event.extraction_method,
      ocr: event.extraction_method === "ocr",
    };
    existingFileTrack.count++;
    processedFilesMap.set(fileKey, existingFileTrack);

    // Strict mapping to Report schema (preserving UNKNOWN where missing)
    const reportDate = event.reported_date || new Date().toISOString().split("T")[0];
    const reportSite = event.site?.trim() || "UNKNOWN";
    const reportActivity = event.activity?.trim() || "UNKNOWN";
    const reportType = normalizeSafetyEventType(event.event_type || "Near-Miss");

    const report: Report = {
      id: event.event_id,
      event_type: reportType,
      raw_text: event.raw_text,
      site: reportSite,
      facility: event.facility || undefined,
      activity: reportActivity,
      reported_date: reportDate,
      submitting_role: event.metadata?.submitting_role || null,
      source: "bulk_upload",
      created_at: new Date().toISOString(),
    };

    // Attach enriched multi-format metadata and provenance
    (report as any).source_filename = event.source_filename;
    (report as any).source_format = event.source_format;
    (report as any).source_row_or_page = event.source_row_or_page;
    (report as any).extraction_method = event.extraction_method;
    (report as any).extraction_confidence = event.extraction_confidence;
    (report as any).provenance = event.provenance;
    (report as any).canonical_event = event;

    // Execute Existing SIF Sentinel Classification (Layer A ML + Campbell Gates + IOGP Rules)
    const classification = generateLayerAClassification(
      report.id,
      report.raw_text,
      report.reported_date
    );

    // Attach AI Reasoning Narrative
    classification.reasoning_narrative = await generateReasoningNarrative({
      text: report.raw_text,
      isSif: classification.is_sif_potential,
      rule: classification.life_saving_rule,
      terms: classification.reasoning_terms || [],
    });

    if (classification.is_sif_potential) {
      sifCount++;
    } else {
      nonSifCount++;
    }

    if (classification.life_saving_rule) {
      ruleDistribution[classification.life_saving_rule] =
        (ruleDistribution[classification.life_saving_rule] || 0) + 1;
    }

    reportsToSave.push(report);
    classificationsToSave.push(classification);
  }

  // Persist into safety store
  if (reportsToSave.length > 0) {
    await appendSafetyRecords(reportsToSave, classificationsToSave, {
      actor_name: auditInfo?.actor_name || "Safety Document Ingestion Engine",
      actor_role: auditInfo?.actor_role || "safety_officer",
      details:
        auditInfo?.details ||
        `Ingested ${reportsToSave.length} safety events from multi-format upload (${processedFilesMap.size} files).`,
    });
  }

  const snapshot = await getSafetySnapshot();
  const aggregates = computeAggregates(snapshot.reports, snapshot.classifications);
  const totalEvents = reportsToSave.length;
  const precursorDensity = totalEvents > 0 ? Number((sifCount / totalEvents).toFixed(4)) : 0;

  return {
    success: true,
    total_files: processedFilesMap.size,
    total_events: totalEvents,
    sif_count: sifCount,
    non_sif_count: nonSifCount,
    precursor_density: precursorDensity,
    rule_distribution: ruleDistribution,
    active_patterns_count: aggregates.patternCallouts?.length || 0,
    processed_files: Array.from(processedFilesMap.values()).map((f) => ({
      filename: f.filename,
      format: f.format,
      events_count: f.count,
      extraction_method: f.method,
      ocr_applied: f.ocr,
    })),
    skipped_duplicates: 0,
    errors: [],
  };
}
