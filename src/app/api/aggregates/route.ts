import { NextResponse } from "next/server";
import { computeAggregates } from "@/lib/aggregation-engine";
import { getSafetySnapshot } from "@/lib/safety-store";

export const runtime = "nodejs";

export async function GET() {
  try {
    const snapshot = await getSafetySnapshot();
    const aggregates = computeAggregates(snapshot.reports, snapshot.classifications);

    return NextResponse.json({
      success: true,
      data: aggregates,
      storage: snapshot.storage,
      generatedAt: new Date().toISOString(),
      // Compatibility fields retained for existing pages and v3 API consumers.
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
      openActionsCount: snapshot.actions.filter((a) => a.status !== "verified").length,
      verifiedActionsCount: snapshot.actions.filter((a) => a.status === "verified").length,
      totalActionsCount: snapshot.actions.length,
      totalAuditLogsCount: snapshot.auditLogs.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to compute safety aggregates.";
    console.error("Aggregate computation error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
