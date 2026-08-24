import { NextRequest, NextResponse } from "next/server";
import { memoryDb } from "@/lib/supabase";
import { Report, Classification, ReportWithClassification } from "@/lib/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const report = memoryDb.reports.find((r) => r.id === id);

    if (!report) {
      return NextResponse.json({ success: false, error: "Report not found" }, { status: 404 });
    }

    const classifications = memoryDb.classifications.filter((c) => c.report_id === id);
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
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch report" }, { status: 500 });
  }
}
