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
      total: aggregates.patternCallouts.length,
      patterns: aggregates.patternCallouts,
      storage: snapshot.storage,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to calculate recurring patterns.";
    console.error("Pattern calculation error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
