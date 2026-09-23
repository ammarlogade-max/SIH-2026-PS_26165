// ─── Canonical Normalizer (SIH26165 Rule: Never Invent Missing Fields) ───────

import { v4 as uuidv4 } from "uuid";
import { SafetyEventType, normalizeSafetyEventType } from "@/lib/types";
import {
  CanonicalSafetyEvent,
  FieldProvenance,
  IngestionExtractionMethod,
  IngestionSourceFormat,
} from "./types";
import { computeDocumentFingerprint } from "./fingerprint";

/**
 * Validates and normalizes date string into YYYY-MM-DD or null.
 * Never guesses or fabricates a date.
 */
export function normalizeDate(dateStr?: string | null): string | null {
  if (!dateStr || typeof dateStr !== "string") return null;
  const trimmed = dateStr.trim();
  if (!trimmed || trimmed.toLowerCase() === "null" || trimmed.toLowerCase() === "unknown") {
    return null;
  }

  // Check ISO format YYYY-MM-DD
  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = isoMatch[2].padStart(2, "0");
    const d = isoMatch[3].padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  // Check DD/MM/YYYY or DD-MM-YYYY
  const ddmmyyyy = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (ddmmyyyy) {
    const d = ddmmyyyy[1].padStart(2, "0");
    const m = ddmmyyyy[2].padStart(2, "0");
    const y = ddmmyyyy[3];
    return `${y}-${m}-${d}`;
  }

  // Attempt JavaScript Date parsing
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 1970 && parsed.getFullYear() < 2100) {
    return parsed.toISOString().split("T")[0];
  }

  return null;
}

/**
 * Normalizes event type to standard SafetyEventType enum or null.
 */
export function normalizeEventType(rawType?: string | null): SafetyEventType | null {
  if (!rawType || typeof rawType !== "string") return null;
  const normalized = normalizeSafetyEventType(rawType, "Unknown");
  if (normalized === "Unknown") {
    // If not matched, keep null unless raw text specifically indicated an event
    return null;
  }
  return normalized;
}

/**
 * Extracts structured key-value hints from text narrative if present (e.g. "Site: Moran GGS", "Date: 2026-08-14").
 * If not present, strictly leaves them null.
 */
export function extractMetadataFromNarrative(text: string): {
  site: string | null;
  facility: string | null;
  activity: string | null;
  reported_date: string | null;
  event_type: SafetyEventType | null;
} {
  let site: string | null = null;
  let facility: string | null = null;
  let activity: string | null = null;
  let reported_date: string | null = null;
  let event_type: SafetyEventType | null = null;

  // Search for lines like "Site: ...", "Location: ...", "Field: ..."
  const headerBoundaries = "(?=\\s*(?:Site|Location|Field|Asset|Facility|Complex|Activity|Task|Operation|Job|Date|Reported|Event|Type|Details|Narrative|Observation|Classification)\\s*[:=-]|[\r\n,;|]|$)";

  const siteMatch = text.match(new RegExp(`(?:Site|Location|Field|Asset|Installation|Rig)\\s*[:=-]\\s*([^\\r\\n,;|]+?)${headerBoundaries}`, "i"));
  if (siteMatch && siteMatch[1]?.trim().length > 1) {
    site = siteMatch[1].trim();
  }

  const facilityMatch = text.match(new RegExp(`(?:Facility|Complex|Station|Unit)\\s*[:=-]\\s*([^\\r\\n,;|]+?)${headerBoundaries}`, "i"));
  if (facilityMatch && facilityMatch[1]?.trim().length > 1) {
    facility = facilityMatch[1].trim();
  }

  const actMatch = text.match(new RegExp(`(?:Activity|Task|Operation|Job|Work\\s*Type)\\s*[:=-]\\s*([^\\r\\n,;|]+?)${headerBoundaries}`, "i"));
  if (actMatch && actMatch[1]?.trim().length > 1) {
    activity = actMatch[1].trim();
  }

  const dateMatch = text.match(new RegExp(`(?:Date|Reported\\s*Date|Incident\\s*Date|Observed\\s*Date|Timestamp)\\s*[:=-]\\s*([^\\r\\n,;|]+?)${headerBoundaries}`, "i"));
  if (dateMatch && dateMatch[1]?.trim()) {
    reported_date = normalizeDate(dateMatch[1].trim());
  }

  const typeMatch = text.match(new RegExp(`(?:Event\\s*Type|Type|Category|Classification)\\s*[:=-]\\s*([^\\r\\n,;|]+?)${headerBoundaries}`, "i"));
  if (typeMatch && typeMatch[1]?.trim()) {
    event_type = normalizeEventType(typeMatch[1].trim());
  }

  return { site, facility, activity, reported_date, event_type };
}

/**
 * Constructs a strict CanonicalSafetyEvent with full provenance tracking.
 */
export function createCanonicalSafetyEvent(params: {
  source_filename: string;
  source_format: IngestionSourceFormat;
  raw_text: string;
  reported_date?: string | null;
  site?: string | null;
  facility?: string | null;
  activity?: string | null;
  event_type?: SafetyEventType | null;
  source_row_or_page?: string | number | null;
  extraction_method: IngestionExtractionMethod;
  extraction_confidence: number;
  metadata?: Record<string, any>;
  provenanceList?: FieldProvenance[];
  idPrefix?: string;
}): CanonicalSafetyEvent {
  const event_id = `${params.idPrefix || "evt"}-${uuidv4().slice(0, 8)}`;
  const cleanRawText = params.raw_text.trim();
  const normalizedDate = normalizeDate(params.reported_date);
  const normalizedType = params.event_type || null;
  const siteVal = params.site?.trim() ? params.site.trim() : null;
  const facilityVal = params.facility?.trim() ? params.facility.trim() : null;
  const activityVal = params.activity?.trim() ? params.activity.trim() : null;

  // Build provenance tracking if not supplied
  const provenance: FieldProvenance[] = params.provenanceList || [];
  const sourceLocation = params.source_row_or_page
    ? typeof params.source_row_or_page === "number"
      ? `page/row ${params.source_row_or_page}`
      : String(params.source_row_or_page)
    : "document";

  if (!provenance.some((p) => p.field === "raw_text")) {
    provenance.push({
      field: "raw_text",
      value: cleanRawText.slice(0, 100),
      source: sourceLocation,
      confidence: params.extraction_confidence,
    });
  }

  if (siteVal && !provenance.some((p) => p.field === "site")) {
    provenance.push({
      field: "site",
      value: siteVal,
      source: sourceLocation,
      evidence: siteVal,
      confidence: 0.9,
    });
  }

  if (activityVal && !provenance.some((p) => p.field === "activity")) {
    provenance.push({
      field: "activity",
      value: activityVal,
      source: sourceLocation,
      evidence: activityVal,
      confidence: 0.88,
    });
  }

  if (normalizedDate && !provenance.some((p) => p.field === "reported_date")) {
    provenance.push({
      field: "reported_date",
      value: normalizedDate,
      source: sourceLocation,
      evidence: normalizedDate,
      confidence: 0.95,
    });
  }

  const fingerprint = computeDocumentFingerprint(undefined, cleanRawText);

  return {
    event_id,
    source_filename: params.source_filename,
    source_format: params.source_format,
    raw_text: cleanRawText,
    reported_date: normalizedDate,
    site: siteVal,
    facility: facilityVal,
    activity: activityVal,
    event_type: normalizedType,
    source_row_or_page: params.source_row_or_page ?? null,
    extraction_method: params.extraction_method,
    extraction_confidence: Math.min(1.0, Math.max(0.1, Number(params.extraction_confidence.toFixed(2)))),
    metadata: params.metadata || {},
    provenance,
    fingerprint,
  };
}
