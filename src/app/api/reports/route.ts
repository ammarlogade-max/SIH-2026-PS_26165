import { NextRequest, NextResponse } from "next/server";
import { memoryDb, supabase } from "@/lib/supabase";
import { generateLayerAClassification } from "@/lib/layer-a-classifier";
import { generateReasoningNarrative } from "@/lib/narrative-engine";
import { computeAggregates } from "@/lib/aggregation-engine";
import { Report, Classification, ReportWithClassification } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const site = searchParams.get("site");
    const rule = searchParams.get("rule");
    const sifStatus = searchParams.get("sif"); // "sif", "non_sif", "all"
    const search = searchParams.get("search");

    // Fetch reports and classifications
    const reports: Report[] = memoryDb.reports;
    const classifications: Classification[] = memoryDb.classifications;

    const classMap = new Map<string, Classification>();
    for (const cls of classifications) {
      if (cls.layer === "A" || !classMap.has(cls.report_id)) {
        classMap.set(cls.report_id, cls);
      }
    }

    let combined: ReportWithClassification[] = reports.map((r) => ({
      ...r,
      classification: classMap.get(r.id),
    }));

    // Filter by site
    if (site && site !== "all") {
      combined = combined.filter((r) => r.site.toLowerCase() === site.toLowerCase());
    }

    // Filter by SIF status
    if (sifStatus === "sif") {
      combined = combined.filter((r) => r.classification?.is_sif_potential === true);
    } else if (sifStatus === "non_sif") {
      combined = combined.filter((r) => r.classification?.is_sif_potential === false);
    }

    // Filter by Life-Saving Rule
    if (rule && rule !== "all") {
      combined = combined.filter((r) => r.classification?.life_saving_rule === rule);
    }

    // Filter by search query
    if (search && search.trim().length > 0) {
      const q = search.toLowerCase();
      combined = combined.filter(
        (r) =>
          r.raw_text.toLowerCase().includes(q) ||
          r.site.toLowerCase().includes(q) ||
          r.activity.toLowerCase().includes(q) ||
          (r.classification?.life_saving_rule && r.classification.life_saving_rule.toLowerCase().includes(q))
      );
    }

    // Sort newest first
    combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({
      success: true,
      total: combined.length,
      reports: combined,
    });
  } catch (error: any) {
    console.error("Error fetching reports:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch reports" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { raw_text, site, activity, reported_date, submitting_role } = body;

    if (!raw_text || typeof raw_text !== "string" || raw_text.trim().length === 0) {
      return NextResponse.json({ success: false, error: "Observation text is required." }, { status: 400 });
    }

    const reportId = `rep-${uuidv4()}`;
    const newReport: Report = {
      id: reportId,
      raw_text: raw_text.trim(),
      site: site?.trim() || "General Facility",
      activity: activity?.trim() || "General Operations",
      reported_date: reported_date || new Date().toISOString().split("T")[0],
      submitting_role: submitting_role?.trim() || "Field Staff",
      source: "manual",
      created_at: new Date().toISOString(),
    };

    // Run Layer A Classifier immediately
    const classification = generateLayerAClassification(reportId, newReport.raw_text);

    // Generate explanatory narrative
    const narrative = await generateReasoningNarrative({
      text: newReport.raw_text,
      isSif: classification.is_sif_potential,
      rule: classification.life_saving_rule,
      terms: classification.reasoning_terms,
    });
    classification.reasoning_narrative = narrative;

    // Save report & classification
    memoryDb.reports.unshift(newReport);
    memoryDb.classifications.unshift(classification);

    // Recompute aggregates
    const aggregates = computeAggregates(memoryDb.reports, memoryDb.classifications);
    memoryDb.site_activity_aggregates = aggregates.siteAggregates;
    memoryDb.pattern_callouts = aggregates.patternCallouts;

    return NextResponse.json({
      success: true,
      report: {
        ...newReport,
        classification,
      },
      classification,
      aggregatesSummary: {
        totalReports: aggregates.totalReports,
        sifReportsCount: aggregates.sifReportsCount,
        overallPrecursorDensity: aggregates.overallPrecursorDensity,
      },
    });
  } catch (error: any) {
    console.error("Error creating report:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to process observation" }, { status: 500 });
  }
}
