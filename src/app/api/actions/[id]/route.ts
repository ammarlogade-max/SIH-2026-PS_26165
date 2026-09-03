import { NextRequest, NextResponse } from "next/server";
import { updateCorrectiveAction } from "@/lib/safety-store";
import { UserRole } from "@/lib/types";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { actor_name = "Safety Auditor", actor_role = "HSE Officer", ...updates } = body;

    const updated = await updateCorrectiveAction(id, updates, {
      name: actor_name,
      role: actor_role as UserRole,
    });

    return NextResponse.json({ action: updated });
  } catch (error) {
    console.error("Failed to update corrective action:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update action" },
      { status: 500 }
    );
  }
}
