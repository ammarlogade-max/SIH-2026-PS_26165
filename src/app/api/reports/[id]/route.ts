import { NextRequest, NextResponse } from "next/server";
import { getSafetySnapshot } from "@/lib/safety-store";
import { ReportWithClassification } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const snapshot = await getSafetySnapshot();
    const report = snapshot.reports.find((record) => record.id === id);

    if (!report) {
      return NextResponse.json({ success: false, error: "Report not found" }, { status: 404 });
    }

    const classifications = snapshot.classifications.filter((classification) => classification.report_id === id);
    const layerA = classifications.find((c) => c.layer === "A");
    const layerB = classifications.find((c) => c.layer === "B");

    const result: ReportWithClassification = {
      ...report,
      classification: layerA || classifications[0],
      layer_b_classification: layerB,
    };

    return NextResponse.json({
      success: true,
      report: result,
      storage: snapshot.storage,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch report.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
