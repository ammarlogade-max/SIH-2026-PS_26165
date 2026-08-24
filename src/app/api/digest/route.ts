import { NextResponse } from "next/server";
import { memoryDb } from "@/lib/supabase";
import { computeAggregates } from "@/lib/aggregation-engine";
import { generateWeeklyHseDigest } from "@/lib/narrative-engine";

export async function GET() {
  try {
    const aggregates = computeAggregates(memoryDb.reports, memoryDb.classifications);
    const digest = await generateWeeklyHseDigest(aggregates);
    return NextResponse.json({
      success: true,
      digest,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to generate digest" }, { status: 500 });
  }
}
