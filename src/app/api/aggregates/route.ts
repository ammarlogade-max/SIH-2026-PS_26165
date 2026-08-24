import { NextResponse } from "next/server";
import { memoryDb } from "@/lib/supabase";
import { computeAggregates } from "@/lib/aggregation-engine";

export async function GET() {
  try {
    const aggregates = computeAggregates(memoryDb.reports, memoryDb.classifications);
    return NextResponse.json({
      success: true,
      data: aggregates,
      aggregates: aggregates.siteAggregates,
      totalReports: aggregates.totalReports,
      sifReportsCount: aggregates.sifReportsCount,
      nonSifReportsCount: aggregates.nonSifReportsCount,
      overallPrecursorDensity: aggregates.overallPrecursorDensity,
      siteAggregates: aggregates.siteAggregates,
      activityAggregates: aggregates.activityAggregates,
      ruleDistribution: aggregates.ruleDistribution,
      patternCallouts: aggregates.patternCallouts,
      topRiskSite: aggregates.topRiskSite,
      highestRiskDensity: aggregates.highestRiskDensity,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to compute aggregates" }, { status: 500 });
  }
}
