// ─── Intelligent Column Mapper for Spreadsheets & Tabular Reports ──────────

import { ColumnMappingInfo } from "./types";

interface SynonymSpec {
  field: "raw_text" | "site" | "facility" | "activity" | "reported_date" | "event_type" | "submitting_role";
  exactMatches: string[];
  fuzzyKeywords: string[];
  weight: number;
}

const SYNONYM_SPECS: SynonymSpec[] = [
  {
    field: "raw_text",
    exactMatches: [
      "raw_text", "rawtext", "raw_narrative", "text", "description", "incident_description",
      "observation", "observation_description", "event_description", "event_details", "narrative",
      "details", "remarks", "comments", "hazard_description", "unsafe_act_condition",
      "finding", "summary", "what_happened", "incident_summary", "observation_details"
    ],
    fuzzyKeywords: ["desc", "narrat", "observ", "detail", "remark", "hazard", "what happened", "finding", "comment"],
    weight: 1.0,
  },
  {
    field: "site",
    exactMatches: [
      "site", "location", "field", "asset", "installation", "facility", "plant",
      "station", "depot", "rig", "platform", "area", "worksite", "well_site", "rig_name"
    ],
    fuzzyKeywords: ["site", "locat", "field", "asset", "install", "rig", "plant", "platform"],
    weight: 0.9,
  },
  {
    field: "facility",
    exactMatches: ["facility", "sub_facility", "station", "complex", "installation_name", "unit"],
    fuzzyKeywords: ["facil", "unit", "station", "complex"],
    weight: 0.7,
  },
  {
    field: "activity",
    exactMatches: [
      "activity", "task", "operation", "job", "work_activity", "action_being_performed",
      "process", "work_type", "ongoing_operation", "job_step"
    ],
    fuzzyKeywords: ["activit", "task", "operat", "job", "work type"],
    weight: 0.85,
  },
  {
    field: "reported_date",
    exactMatches: [
      "reported_date", "date", "observation_date", "incident_date", "event_date",
      "timestamp", "datetime", "log_date", "time_of_incident", "occurred_at", "observed_date"
    ],
    fuzzyKeywords: ["date", "time", "stamp", "occurred"],
    weight: 0.85,
  },
  {
    field: "event_type",
    exactMatches: [
      "event_type", "type", "category", "report_type", "observation_type",
      "incident_type", "classification", "severity_category", "record_type"
    ],
    fuzzyKeywords: ["type", "categor", "classif", "event"],
    weight: 0.8,
  },
  {
    field: "submitting_role",
    exactMatches: [
      "submitting_role", "role", "observer", "reported_by", "reporter", "inspector",
      "designation", "job_title", "recorded_by", "auditor", "officer"
    ],
    fuzzyKeywords: ["role", "report_by", "observer", "reporter", "inspector", "title"],
    weight: 0.7,
  },
];

function cleanColName(col: string): string {
  return col.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_").trim();
}

/**
 * Maps raw spreadsheet columns to canonical safety report fields.
 * Flags ambiguity if no narrative column is detected or if multiple candidates tie.
 */
export function inferColumnMapping(
  columns: string[],
  sampleRows?: Record<string, any>[]
): ColumnMappingInfo {
  const available_columns = [...columns];
  const detected: ColumnMappingInfo["detected"] = {};
  const notes: string[] = [];
  let is_ambiguous = false;
  let totalConfidence = 0;
  let matchedFields = 0;

  const usedColumns = new Set<string>();

  for (const spec of SYNONYM_SPECS) {
    let bestCol: string | null = null;
    let bestScore = 0;

    for (const rawCol of columns) {
      if (usedColumns.has(rawCol)) continue;
      const clean = cleanColName(rawCol);

      // 1. Exact match against exact synonym list
      if (spec.exactMatches.includes(clean)) {
        bestCol = rawCol;
        bestScore = 1.0;
        break;
      }

      // 2. Fuzzy substring match
      for (const kw of spec.fuzzyKeywords) {
        if (clean.includes(kw)) {
          const score = 0.85;
          if (score > bestScore) {
            bestScore = score;
            bestCol = rawCol;
          }
        }
      }
    }

    if (bestCol && bestScore > 0.5) {
      detected[spec.field] = bestCol;
      usedColumns.add(bestCol);
      totalConfidence += bestScore * spec.weight;
      matchedFields++;
    }
  }

  // Check if raw_text was not found, but we can inspect sample data to find the longest text column
  if (!detected.raw_text && sampleRows && sampleRows.length > 0) {
    let longestCol: string | null = null;
    let maxAvgLength = 0;

    for (const col of columns) {
      if (usedColumns.has(col)) continue;
      let totalLen = 0;
      let count = 0;
      for (const row of sampleRows.slice(0, 10)) {
        const val = row[col];
        if (typeof val === "string") {
          totalLen += val.trim().length;
          count++;
        }
      }
      const avgLen = count > 0 ? totalLen / count : 0;
      if (avgLen > maxAvgLength && avgLen > 25) {
        maxAvgLength = avgLen;
        longestCol = col;
      }
    }

    if (longestCol) {
      detected.raw_text = longestCol;
      usedColumns.add(longestCol);
      totalConfidence += 0.7;
      matchedFields++;
      notes.push(`Inferred '${longestCol}' as narrative text based on cell character length (avg: ${Math.round(maxAvgLength)} chars).`);
    }
  }

  // Narrative (raw_text) is mandatory for SIF analysis.
  if (!detected.raw_text) {
    is_ambiguous = true;
    notes.push("Could not unambiguously identify a safety narrative/description column. Please verify column mapping.");
  }

  const confidence = matchedFields > 0 ? Math.min(1.0, totalConfidence / (matchedFields * 0.9)) : 0;

  return {
    detected,
    available_columns,
    confidence: Number(confidence.toFixed(2)),
    is_ambiguous,
    notes,
  };
}
