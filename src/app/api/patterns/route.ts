import { NextResponse } from "next/server";
import { memoryDb } from "@/lib/supabase";
import { computeAggregates } from "@/lib/aggregation-engine";

export async function GET() {
  try {
    const aggregates = computeAggregates(memoryDb.reports, memoryDb.classifications);
    return NextResponse.json({
      success: true,
      total: aggregates.patternCallouts.length,
      patterns: aggregates.patternCallouts,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch patterns" }, { status: 500 });
  }
}
