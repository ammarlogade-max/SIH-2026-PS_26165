import { NextRequest, NextResponse } from "next/server";
import { resetSafetyStore } from "@/lib/safety-store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const seedBenchmark = body.seedBenchmark !== false; // defaults to true
    const snapshot = await resetSafetyStore(seedBenchmark);

    return NextResponse.json({
      success: true,
      message: seedBenchmark
        ? "Restored authentic synthetic industrial benchmark dataset with 48 observations and verified classifications."
        : "Safety workspace cleared. Ready for fresh observations.",
      report_count: snapshot.reports.length,
      action_count: snapshot.actions.length,
    });
  } catch (error) {
    console.error("Failed to reset safety store:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to reset safety store" },
      { status: 500 }
    );
  }
}
