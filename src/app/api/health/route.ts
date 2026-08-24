import { NextResponse } from "next/server";
import { memoryDb } from "@/lib/supabase";

export async function GET() {
  return NextResponse.json({
    status: "healthy",
    service: "SIF Sentinel (SIH26165) API",
    version: "3.0.0",
    layer_a_classifier: "operational (TF-IDF + Logistic Regression)",
    layer_b_transformer: "ready (DistilBERT / Camber Cloud GPU)",
    database_records: {
      reports: memoryDb.reports.length,
      classifications: memoryDb.classifications.length,
      site_aggregates: memoryDb.site_activity_aggregates.length,
      pattern_callouts: memoryDb.pattern_callouts.length,
    },
    timestamp: new Date().toISOString(),
  });
}
