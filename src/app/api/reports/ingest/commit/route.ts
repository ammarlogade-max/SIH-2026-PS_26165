// ─── POST /api/reports/ingest/commit ────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { commitCanonicalEventsToPipeline } from "@/lib/ingestion/ingestion-pipeline";
import { CanonicalSafetyEvent } from "@/lib/ingestion/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const events: CanonicalSafetyEvent[] = Array.isArray(body.events) ? body.events : [];

    if (events.length === 0) {
      return NextResponse.json(
        { error: "No canonical safety events provided to commit." },
        { status: 400 }
      );
    }

    const audit = body.audit || {
      actor_name: "Safety Officer",
      actor_role: "safety_officer",
      details: `Batch ingestion committed: ${events.length} safety events.`,
    };

    const result = await commitCanonicalEventsToPipeline(events, audit);

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[API Ingest Commit] Error:", err);
    return NextResponse.json(
      { error: "Failed to commit safety events to pipeline", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
