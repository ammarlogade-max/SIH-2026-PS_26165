import { NextRequest, NextResponse } from "next/server";
import { memoryDb } from "@/lib/supabase";
import { generateLayerAClassification } from "@/lib/layer-a-classifier";
import { generateReasoningNarrative } from "@/lib/narrative-engine";
import { computeAggregates } from "@/lib/aggregation-engine";
import { Report, Classification } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

interface BulkReportInput {
  raw_text: string;
  site?: string;
  activity?: string;
  reported_date?: string;
  submitting_role?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { reports } = body;

    if (!reports || !Array.isArray(reports) || reports.length === 0) {
      return NextResponse.json({ success: false, error: "An array of reports is required for bulk ingestion." }, { status: 400 });
    }

    const insertedReports: Report[] = [];
    const insertedClassifications: Classification[] = [];

    let sifCount = 0;
    const ruleDistribution: Record<string, number> = {};

    for (const item of reports as BulkReportInput[]) {
      if (!item.raw_text || typeof item.raw_text !== "string" || item.raw_text.trim().length === 0) {
        continue; // skip invalid rows
      }

      const reportId = `rep-${uuidv4()}`;
      const newReport: Report = {
        id: reportId,
        raw_text: item.raw_text.trim(),
        site: item.site?.trim() || "General Facility",
        activity: item.activity?.trim() || "General Operations",
        reported_date: item.reported_date || new Date().toISOString().split("T")[0],
        submitting_role: item.submitting_role?.trim() || "Field Observer",
        source: "bulk_upload",
        created_at: new Date().toISOString(),
      };

      // Classify with Layer A
      const classification = generateLayerAClassification(reportId, newReport.raw_text);

      // Fast deterministic narrative for batch
      const narrative = await generateReasoningNarrative({
        text: newReport.raw_text,
        isSif: classification.is_sif_potential,
        rule: classification.life_saving_rule,
        terms: classification.reasoning_terms,
      });
      classification.reasoning_narrative = narrative;

      if (classification.is_sif_potential) {
        sifCount++;
        if (classification.life_saving_rule) {
          ruleDistribution[classification.life_saving_rule] = (ruleDistribution[classification.life_saving_rule] || 0) + 1;
        }
      }

      insertedReports.push(newReport);
      insertedClassifications.push(classification);
    }

    if (insertedReports.length === 0) {
      return NextResponse.json({ success: false, error: "No valid safety report rows were found in the uploaded data." }, { status: 400 });
    }

    // Persist all records
    memoryDb.reports.unshift(...insertedReports);
    memoryDb.classifications.unshift(...insertedClassifications);

    // Recompute all aggregates & pattern callouts
    const aggregates = computeAggregates(memoryDb.reports, memoryDb.classifications);
    memoryDb.site_activity_aggregates = aggregates.siteAggregates;
    memoryDb.pattern_callouts = aggregates.patternCallouts;

    return NextResponse.json({
      success: true,
      batchSummary: {
        total_processed: insertedReports.length,
        totalIngested: insertedReports.length,
        sif_count: sifCount,
        sifCount,
        non_sif_count: insertedReports.length - sifCount,
        nonSifCount: insertedReports.length - sifCount,
        precursor_density: Number(((sifCount / insertedReports.length) * 100).toFixed(1)),
        precursorDensity: Number(((sifCount / insertedReports.length) * 100).toFixed(1)),
        ruleBreakdown: ruleDistribution,
        totalDatabaseReports: memoryDb.reports.length,
        activePatternsDetected: aggregates.patternCallouts.length,
      },
    });
  } catch (error: any) {
    console.error("Error during bulk ingestion:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to process bulk upload" }, { status: 500 });
  }
}
