import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { computeAggregates } from "@/lib/aggregation-engine";
import { generateLayerAClassification } from "@/lib/layer-a-classifier";
import { generateReasoningNarrative } from "@/lib/narrative-engine";
import { appendSafetyRecords, getSafetySnapshot } from "@/lib/safety-store";
import { detectShiftAndCircadianRisk } from "@/lib/safety-science-engine";
import type { Classification, Report, ReportWithClassification, ShiftTiming } from "@/lib/types";

export const runtime = "nodejs";

const MAX_OBSERVATION_LENGTH = 12000;

function validDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return !Number.isNaN(new Date(`${value}T00:00:00`).getTime());
}

function cleanOptionalText(value: unknown, fallback: string, maximum = 160): string {
  if (typeof value !== "string") return fallback;
  const cleaned = value.trim().replace(/\s+/g, " ");
  return cleaned ? cleaned.slice(0, maximum) : fallback;
}

function buildClassifiedReports(reports: Report[], classifications: Classification[]): ReportWithClassification[] {
  const classMap = new Map<string, Classification>();
  for (const classification of classifications) {
    if (classification.layer === "A" || !classMap.has(classification.report_id)) {
      classMap.set(classification.report_id, classification);
    }
  }
  return reports.map((report) => ({ ...report, classification: classMap.get(report.id) }));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const site = searchParams.get("site");
    const rule = searchParams.get("rule");
    const sifStatus = searchParams.get("sif");
    const energy = searchParams.get("energy");
    const shift = searchParams.get("shift");
    const search = searchParams.get("search")?.trim().toLowerCase();
    const requestedLimit = Number.parseInt(searchParams.get("limit") || "", 10);
    const limit = Number.isFinite(requestedLimit) && requestedLimit > 0
      ? Math.min(requestedLimit, 500)
      : undefined;

    const snapshot = await getSafetySnapshot();
    let combined = buildClassifiedReports(snapshot.reports, snapshot.classifications);

    if (site && site !== "all") {
      combined = combined.filter((report) => report.site.toLowerCase() === site.toLowerCase());
    }
    if (sifStatus === "sif") {
      combined = combined.filter((report) => report.classification?.is_sif_potential === true);
    } else if (sifStatus === "non_sif") {
      combined = combined.filter((report) => report.classification?.is_sif_potential === false);
    }
    if (rule && rule !== "all") {
      combined = combined.filter((report) => report.classification?.life_saving_rule === rule);
    }
    if (energy && energy !== "all") {
      combined = combined.filter((report) => report.classification?.energy_category === energy);
    }
    if (shift && shift !== "all") {
      combined = combined.filter((report) => report.shift_timing === shift);
    }
    if (search) {
      combined = combined.filter((report) =>
        report.id.toLowerCase().includes(search) ||
        report.raw_text.toLowerCase().includes(search) ||
        report.site.toLowerCase().includes(search) ||
        report.activity.toLowerCase().includes(search) ||
        Boolean(report.classification?.life_saving_rule?.toLowerCase().includes(search)) ||
        Boolean(report.classification?.energy_category?.toLowerCase().includes(search))
      );
    }

    combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const total = combined.length;

    return NextResponse.json({
      success: true,
      total,
      reports: limit ? combined.slice(0, limit) : combined,
      storage: snapshot.storage,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch safety reports.";
    console.error("Safety report read error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const input = body && typeof body === "object" ? body as Record<string, unknown> : {};
    const rawText = typeof input.raw_text === "string" ? input.raw_text.trim() : "";

    if (!rawText) {
      return NextResponse.json({ success: false, error: "Observation text is required." }, { status: 400 });
    }
    if (rawText.length > MAX_OBSERVATION_LENGTH) {
      return NextResponse.json({ success: false, error: `Observation text must not exceed ${MAX_OBSERVATION_LENGTH} characters.` }, { status: 400 });
    }
    if (input.reported_date !== undefined && !validDate(input.reported_date)) {
      return NextResponse.json({ success: false, error: "reported_date must use YYYY-MM-DD." }, { status: 400 });
    }

    const reportId = `rep-${uuidv4()}`;
    const reportedDate = validDate(input.reported_date) ? input.reported_date : new Date().toISOString().slice(0, 10);
    const shiftInfo = detectShiftAndCircadianRisk(reportedDate);
    const shiftTiming = typeof input.shift_timing === "string" ? (input.shift_timing as ShiftTiming) : shiftInfo.shift_timing;

    const report: Report = {
      id: reportId,
      raw_text: rawText,
      site: cleanOptionalText(input.site, "General Facility"),
      activity: cleanOptionalText(input.activity, "General Operations"),
      reported_date: reportedDate,
      shift_timing: shiftTiming,
      circadian_risk_tier: shiftInfo.circadian_risk_tier,
      submitting_role: cleanOptionalText(input.submitting_role, "Field Staff", 100),
      source: "manual",
      created_at: new Date().toISOString(),
    };

    const classification = generateLayerAClassification(report.id, report.raw_text, report.reported_date);
    classification.reasoning_narrative = await generateReasoningNarrative({
      text: report.raw_text,
      isSif: classification.is_sif_potential,
      rule: classification.life_saving_rule,
      terms: classification.reasoning_terms,
    });

    const snapshot = await appendSafetyRecords([report], [classification]);
    const aggregates = computeAggregates(snapshot.reports, snapshot.classifications);

    return NextResponse.json({
      success: true,
      report: { ...report, classification },
      classification,
      storage: snapshot.storage,
      aggregatesSummary: {
        totalReports: aggregates.totalReports,
        sifReportsCount: aggregates.sifReportsCount,
        overallPrecursorDensity: aggregates.overallPrecursorDensity,
      },
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to process observation.";
    console.error("Safety report write error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
