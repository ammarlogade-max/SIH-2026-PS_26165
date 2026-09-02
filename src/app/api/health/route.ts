import { NextResponse } from "next/server";
import { getSafetySnapshot } from "@/lib/safety-store";

export const runtime = "nodejs";

export async function GET() {
  try {
    const snapshot = await getSafetySnapshot();
    return NextResponse.json({
      status: "healthy",
      service: "SIF Sentinel (SIH26165) API",
      version: "3.1.0",
      layer_a_classifier: "operational (TF-IDF + Logistic Regression)",
      layer_b_transformer: "not started — Layer A sign-off required",
      storage: snapshot.storage,
      database_records: {
        reports: snapshot.reports.length,
        classifications: snapshot.classifications.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Storage health check failed.";
    return NextResponse.json({ status: "unhealthy", error: message, timestamp: new Date().toISOString() }, { status: 503 });
  }
}
