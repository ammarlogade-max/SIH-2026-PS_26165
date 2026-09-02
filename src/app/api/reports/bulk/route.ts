import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { computeAggregates } from "@/lib/aggregation-engine";
import { generateLayerAClassification } from "@/lib/layer-a-classifier";
import { generateReasoningNarrative } from "@/lib/narrative-engine";
import { appendSafetyRecords } from "@/lib/safety-store";
import type { Classification, Report } from "@/lib/types";

export const runtime = "nodejs";

type BulkReportInput = {
  raw_text?: unknown;
  site?: unknown;
  activity?: unknown;
  reported_date?: unknown;
  submitting_role?: unknown;
};

const MAX_BATCH_SIZE = 500;
const MAX_OBSERVATION_LENGTH = 12000;

function validDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return !Number.isNaN(new Date(`${value}T00:00:00`).getTime());
}

function cleanText(value: unknown, fallback: string, maximum = 160): string {
  if (typeof value !== "string") return fallback;
  const cleaned = value.trim().replace(/\s+/g, " ");
  return cleaned ? cleaned.slice(0, maximum) : fallback;
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const items = body && typeof body === "object" ? (body as { reports?: unknown }).reports : undefined;

    if (!Array.isArray(items) || !items.length) {
      return NextResponse.json({ success: false, error: "An array of reports is required for bulk ingestion." }, { status: 400 });
    }
    if (items.length > MAX_BATCH_SIZE) {
      return NextResponse.json({ success: false, error: `Bulk ingestion accepts at most ${MAX_BATCH_SIZE} reports at a time.` }, { status: 400 });
    }

    const insertedReports: Report[] = [];
    const insertedClassifications: Classification[] = [];
    const skippedRows: { row: number; reason: string }[] = [];
    const ruleDistribution: Record<string, number> = {};
    let sifCount = 0;

    for (const [index, item] of (items as BulkReportInput[]).entries()) {
      const rawText = typeof item.raw_text === "string" ? item.raw_text.trim() : "";
      if (!rawText) {
        skippedRows.push({ row: index + 1, reason: "Missing observation text" });
        continue;
      }
      if (rawText.length > MAX_OBSERVATION_LENGTH) {
        skippedRows.push({ row: index + 1, reason: `Observation exceeds ${MAX_OBSERVATION_LENGTH} characters` });
        continue;
      }
      if (item.reported_date !== undefined && !validDate(item.reported_date)) {
        skippedRows.push({ row: index + 1, reason: "reported_date must use YYYY-MM-DD" });
        continue;
      }

      const report: Report = {
        id: `rep-${uuidv4()}`,
        raw_text: rawText,
        site: cleanText(item.site, "General Facility"),
        activity: cleanText(item.activity, "General Operations"),
        reported_date: validDate(item.reported_date) ? item.reported_date : new Date().toISOString().slice(0, 10),
        submitting_role: cleanText(item.submitting_role, "Field Observer", 100),
        source: "bulk_upload",
        created_at: new Date().toISOString(),
      };
      const classification = generateLayerAClassification(report.id, report.raw_text);
      classification.reasoning_narrative = await generateReasoningNarrative({
        text: report.raw_text,
        isSif: classification.is_sif_potential,
        rule: classification.life_saving_rule,
        terms: classification.reasoning_terms,
      });

      insertedReports.push(report);
      insertedClassifications.push(classification);
      if (classification.is_sif_potential) {
        sifCount += 1;
        if (classification.life_saving_rule) {
          ruleDistribution[classification.life_saving_rule] = (ruleDistribution[classification.life_saving_rule] || 0) + 1;
        }
      }
    }

    if (!insertedReports.length) {
      return NextResponse.json({
        success: false,
        error: "No valid safety report rows were found in the uploaded data.",
        skippedRows,
      }, { status: 400 });
    }

    const snapshot = await appendSafetyRecords(insertedReports, insertedClassifications);
    const aggregates = computeAggregates(snapshot.reports, snapshot.classifications);
    const precursorDensity = Number(((sifCount / insertedReports.length) * 100).toFixed(1));

    return NextResponse.json({
      success: true,
      storage: snapshot.storage,
      skippedRows,
      batchSummary: {
        total_processed: insertedReports.length,
        totalIngested: insertedReports.length,
        sif_count: sifCount,
        sifCount,
        non_sif_count: insertedReports.length - sifCount,
        nonSifCount: insertedReports.length - sifCount,
        precursor_density: precursorDensity,
        precursorDensity,
        ruleBreakdown: ruleDistribution,
        totalDatabaseReports: snapshot.reports.length,
        activePatternsDetected: aggregates.patternCallouts.length,
      },
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to process bulk upload.";
    console.error("Bulk safety ingestion error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
