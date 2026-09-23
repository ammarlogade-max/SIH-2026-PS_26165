// ─── SIF Sentinel Canonical Ingestion Types (SIH26165) ─────────────────────

import { SafetyEventType, ShiftTiming, CircadianRiskTier } from "@/lib/types";

export type IngestionSourceFormat =
  | "pdf"
  | "docx"
  | "doc"
  | "xlsx"
  | "xls"
  | "csv"
  | "tsv"
  | "image"
  | "txt"
  | "rtf"
  | "manual"
  | "unsupported"
  | "unknown";

export type IngestionExtractionMethod =
  | "direct_text"
  | "ocr"
  | "sheet_row"
  | "docx_xml"
  | "text_plain"
  | "rtf_strip"
  | "manual"
  | "fallback";

export interface FieldProvenance {
  field: "raw_text" | "site" | "facility" | "activity" | "reported_date" | "event_type" | "submitting_role" | string;
  value: string | null;
  source: string; // e.g. "page 2", "worksheet 'Observations', row 14, col 'activity'", "paragraph 4", "image scan (OCR)"
  evidence?: string | null;
  confidence: number; // 0.0 to 1.0
}

/**
 * Canonical Safety Event
 * Strict internal representation shared across all input formats.
 * Missing fields remain explicitly null/UNKNOWN — never fabricated.
 */
export interface CanonicalSafetyEvent {
  event_id: string;
  source_filename: string;
  source_format: IngestionSourceFormat;
  raw_text: string;
  reported_date: string | null;
  site: string | null;
  facility: string | null;
  activity: string | null;
  event_type: SafetyEventType | null;
  source_row_or_page: string | number | null;
  extraction_method: IngestionExtractionMethod;
  extraction_confidence: number; // 0.0 to 1.0
  metadata: Record<string, any>;
  provenance: FieldProvenance[];
  fingerprint?: string;
  is_duplicate?: boolean;
}

export interface ColumnMappingInfo {
  sheet_name?: string;
  detected: {
    raw_text?: string;
    site?: string;
    facility?: string;
    activity?: string;
    reported_date?: string;
    event_type?: string;
    submitting_role?: string;
  };
  available_columns: string[];
  confidence: number;
  is_ambiguous: boolean;
  notes?: string[];
}

export interface FileIngestionResult {
  file_id: string;
  filename: string;
  format: IngestionSourceFormat;
  status: "success" | "warning" | "error" | "unsupported";
  pages_or_sheets_count: number;
  rows_or_paragraphs_count: number;
  extracted_text_length: number;
  extraction_method: IngestionExtractionMethod;
  extraction_confidence: number; // 0.0 to 1.0
  is_scanned: boolean;
  ocr_applied: boolean;
  ocr_confidence?: number;
  detected_metadata: {
    site: string | null;
    activity: string | null;
    reported_date: string | null;
    event_type: SafetyEventType | null;
  };
  warnings: string[];
  errors: string[];
  fingerprint: string;
  is_duplicate?: boolean;
  duplicate_details?: string;
  column_mapping?: ColumnMappingInfo;
  available_sheets?: string[];
  selected_sheet?: string;
  canonical_events: CanonicalSafetyEvent[];
}

export interface BatchIngestionCommitResult {
  success: boolean;
  total_files: number;
  total_events: number;
  sif_count: number;
  non_sif_count: number;
  precursor_density: number;
  rule_distribution: Record<string, number>;
  active_patterns_count: number;
  processed_files: {
    filename: string;
    format: IngestionSourceFormat;
    events_count: number;
    extraction_method: string;
    ocr_applied: boolean;
  }[];
  skipped_duplicates: number;
  errors: string[];
}
