import { NextResponse } from "next/server";
import { computeAggregates } from "@/lib/aggregation-engine";
import { generateWeeklyHseDigest } from "@/lib/narrative-engine";
import { getSafetySnapshot } from "@/lib/safety-store";

export const runtime = "nodejs";

export async function GET() {
  try {
    const snapshot = await getSafetySnapshot();
    const aggregates = computeAggregates(snapshot.reports, snapshot.classifications);
    const digest = await generateWeeklyHseDigest(aggregates);
    return NextResponse.json({ success: true, digest, storage: snapshot.storage });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate HSE digest.";
    console.error("Digest generation error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
