import { NextRequest, NextResponse } from "next/server";
import { getSafetySnapshot, saveClassificationReview } from "@/lib/safety-store";
import { ReportWithClassification, UserRole, LifeSavingRule } from "@/lib/types";

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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const {
      is_sif_potential,
      life_saving_rule,
      override_reason,
      review_notes,
      actor_name = "HSE Officer",
      actor_role = "HSE Officer",
    } = body;

    if (override_reason === undefined || override_reason.trim() === "") {
      return NextResponse.json(
        { success: false, error: "A valid override reason is mandatory for HSE review governance." },
        { status: 400 }
      );
    }

    const updatedClassification = await saveClassificationReview(
      id,
      {
        is_sif_potential: Boolean(is_sif_potential),
        life_saving_rule: (life_saving_rule as LifeSavingRule) || null,
        override_reason: override_reason.trim(),
        review_notes: review_notes?.trim(),
      },
      {
        name: actor_name,
        role: actor_role as UserRole,
      }
    );

    return NextResponse.json({
      success: true,
      classification: updatedClassification,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to apply review override.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
