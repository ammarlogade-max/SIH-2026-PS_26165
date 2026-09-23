// ─── Spreadsheet Parser (XLSX, XLS, CSV, TSV) ──────────────────────────────

import * as XLSX from "xlsx";
import { FileIngestionResult, CanonicalSafetyEvent, IngestionSourceFormat, FieldProvenance } from "./types";
import { computeDocumentFingerprint } from "./fingerprint";
import { inferColumnMapping } from "./column-mapper";
import { createCanonicalSafetyEvent, normalizeDate, normalizeEventType } from "./normalizer";

/**
 * Converts Excel serial date or string date to normalized YYYY-MM-DD.
 */
function parseSpreadsheetDate(rawVal: any): string | null {
  if (rawVal == null || rawVal === "") return null;
  if (typeof rawVal === "number" && rawVal > 20000 && rawVal < 60000) {
    // Excel serial date calculation
    const utcDays = Math.floor(rawVal - 25569);
    const utcValue = utcDays * 86400;
    const dateInfo = new Date(utcValue * 1000);
    return dateInfo.toISOString().split("T")[0];
  }
  return normalizeDate(String(rawVal));
}

/**
 * Parses spreadsheets into canonical safety events with per-cell provenance.
 */
export async function parseSpreadsheetDocument(
  buffer: Buffer,
  filename: string,
  options?: {
    forcedSheetName?: string;
    overrideColumnMapping?: Record<string, string>;
  }
): Promise<FileIngestionResult> {
  const warnings: string[] = [];
  const errors: string[] = [];
  const fingerprint = computeDocumentFingerprint(buffer);

  const lower = filename.toLowerCase();
  let format: IngestionSourceFormat = "xlsx";
  if (lower.endsWith(".csv")) format = "csv";
  else if (lower.endsWith(".tsv")) format = "tsv";
  else if (lower.endsWith(".xls")) format = "xls";

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: "buffer", cellDates: false });
  } catch (err: any) {
    return {
      file_id: `file-${Date.now()}`,
      filename,
      format,
      status: "error",
      pages_or_sheets_count: 0,
      rows_or_paragraphs_count: 0,
      extracted_text_length: 0,
      extraction_method: "sheet_row",
      extraction_confidence: 0,
      is_scanned: false,
      ocr_applied: false,
      detected_metadata: { site: null, activity: null, reported_date: null, event_type: null },
      warnings,
      errors: [`Malformed or corrupted spreadsheet: ${err?.message || "unreadable file format"}`],
      fingerprint,
      canonical_events: [],
    };
  }

  const allSheetNames = workbook.SheetNames || [];
  if (allSheetNames.length === 0) {
    return {
      file_id: `file-${Date.now()}`,
      filename,
      format,
      status: "warning",
      pages_or_sheets_count: 0,
      rows_or_paragraphs_count: 0,
      extracted_text_length: 0,
      extraction_method: "sheet_row",
      extraction_confidence: 0.1,
      is_scanned: false,
      ocr_applied: false,
      detected_metadata: { site: null, activity: null, reported_date: null, event_type: null },
      warnings: ["Spreadsheet contains no worksheets."],
      errors,
      fingerprint,
      canonical_events: [],
    };
  }

  // Determine active sheet to parse
  const targetSheetName =
    options?.forcedSheetName && allSheetNames.includes(options.forcedSheetName)
      ? options.forcedSheetName
      : allSheetNames[0];

  const worksheet = workbook.Sheets[targetSheetName];
  if (!worksheet) {
    errors.push(`Target worksheet '${targetSheetName}' could not be read.`);
    return {
      file_id: `file-${Date.now()}`,
      filename,
      format,
      status: "error",
      pages_or_sheets_count: allSheetNames.length,
      rows_or_paragraphs_count: 0,
      extracted_text_length: 0,
      extraction_method: "sheet_row",
      extraction_confidence: 0,
      is_scanned: false,
      ocr_applied: false,
      detected_metadata: { site: null, activity: null, reported_date: null, event_type: null },
      warnings,
      errors,
      fingerprint,
      canonical_events: [],
    };
  }

  // Convert worksheet to JSON rows
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
  if (rawRows.length === 0) {
    warnings.push(`Worksheet '${targetSheetName}' has no data rows.`);
    return {
      file_id: `file-${Date.now()}`,
      filename,
      format,
      status: "warning",
      pages_or_sheets_count: allSheetNames.length,
      rows_or_paragraphs_count: 0,
      extracted_text_length: 0,
      extraction_method: "sheet_row",
      extraction_confidence: 0.2,
      is_scanned: false,
      ocr_applied: false,
      detected_metadata: { site: null, activity: null, reported_date: null, event_type: null },
      warnings,
      errors,
      fingerprint,
      available_sheets: allSheetNames,
      selected_sheet: targetSheetName,
      canonical_events: [],
    };
  }

  // Inspect headers
  const sampleRow = rawRows[0] || {};
  const columns = Object.keys(sampleRow);

  // Apply intelligent column mapping
  const inferredMapping = inferColumnMapping(columns, rawRows);
  if (options?.overrideColumnMapping) {
    inferredMapping.detected = { ...inferredMapping.detected, ...options.overrideColumnMapping };
    inferredMapping.is_ambiguous = false;
  }

  const colMap = inferredMapping.detected;
  if (!colMap.raw_text) {
    warnings.push("Could not find a safety observation/narrative column. Please map the narrative column.");
  }

  const events: CanonicalSafetyEvent[] = [];
  let totalTextLength = 0;

  for (let r = 0; r < rawRows.length; r++) {
    const row = rawRows[r];
    const rowNumber = r + 2; // +1 for 0-index, +1 for header row

    const rawNarrative = colMap.raw_text && row[colMap.raw_text] ? String(row[colMap.raw_text]).trim() : "";
    if (!rawNarrative) continue;

    totalTextLength += rawNarrative.length;

    const rawSite = colMap.site && row[colMap.site] ? String(row[colMap.site]).trim() : null;
    const rawFacility = colMap.facility && row[colMap.facility] ? String(row[colMap.facility]).trim() : null;
    const rawActivity = colMap.activity && row[colMap.activity] ? String(row[colMap.activity]).trim() : null;
    const rawDate = colMap.reported_date && row[colMap.reported_date] ? parseSpreadsheetDate(row[colMap.reported_date]) : null;
    const rawType = colMap.event_type && row[colMap.event_type] ? normalizeEventType(String(row[colMap.event_type])) : null;
    const rawRole = colMap.submitting_role && row[colMap.submitting_role] ? String(row[colMap.submitting_role]).trim() : null;

    // Detailed field-level provenance tracking
    const provenanceList: FieldProvenance[] = [
      {
        field: "raw_text",
        value: rawNarrative.slice(0, 100),
        source: `worksheet '${targetSheetName}', row ${rowNumber}, col '${colMap.raw_text}'`,
        confidence: 0.98,
      },
    ];

    if (rawSite) {
      provenanceList.push({
        field: "site",
        value: rawSite,
        source: `worksheet '${targetSheetName}', row ${rowNumber}, col '${colMap.site}'`,
        evidence: rawSite,
        confidence: 0.95,
      });
    }

    if (rawActivity) {
      provenanceList.push({
        field: "activity",
        value: rawActivity,
        source: `worksheet '${targetSheetName}', row ${rowNumber}, col '${colMap.activity}'`,
        evidence: rawActivity,
        confidence: 0.95,
      });
    }

    if (rawDate) {
      provenanceList.push({
        field: "reported_date",
        value: rawDate,
        source: `worksheet '${targetSheetName}', row ${rowNumber}, col '${colMap.reported_date}'`,
        evidence: String(row[colMap.reported_date!]),
        confidence: 0.98,
      });
    }

    const event = createCanonicalSafetyEvent({
      source_filename: filename,
      source_format: format,
      raw_text: rawNarrative,
      reported_date: rawDate,
      site: rawSite,
      facility: rawFacility,
      activity: rawActivity,
      event_type: rawType,
      source_row_or_page: `row ${rowNumber}`,
      extraction_method: "sheet_row",
      extraction_confidence: inferredMapping.confidence,
      metadata: {
        worksheet_name: targetSheetName,
        row_number: rowNumber,
        submitting_role: rawRole,
      },
      provenanceList,
    });

    events.push(event);
  }

  // Summary detected metadata across sheet
  const firstWithSite = events.find((e) => e.site);
  const firstWithActivity = events.find((e) => e.activity);
  const firstWithDate = events.find((e) => e.reported_date);
  const firstWithType = events.find((e) => e.event_type);

  return {
    file_id: `file-${Date.now()}`,
    filename,
    format,
    status: inferredMapping.is_ambiguous ? "warning" : "success",
    pages_or_sheets_count: allSheetNames.length,
    rows_or_paragraphs_count: events.length,
    extracted_text_length: totalTextLength,
    extraction_method: "sheet_row",
    extraction_confidence: inferredMapping.confidence,
    is_scanned: false,
    ocr_applied: false,
    detected_metadata: {
      site: firstWithSite ? firstWithSite.site : null,
      activity: firstWithActivity ? firstWithActivity.activity : null,
      reported_date: firstWithDate ? firstWithDate.reported_date : null,
      event_type: firstWithType ? firstWithType.event_type : null,
    },
    warnings,
    errors,
    fingerprint,
    column_mapping: inferredMapping,
    available_sheets: allSheetNames,
    selected_sheet: targetSheetName,
    canonical_events: events,
  };
}
