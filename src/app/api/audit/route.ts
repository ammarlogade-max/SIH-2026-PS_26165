import { NextRequest, NextResponse } from "next/server";
import { getSafetySnapshot } from "@/lib/safety-store";

export async function GET(request: NextRequest) {
  try {
    const snapshot = await getSafetySnapshot();
    const auditLogs = snapshot.auditLogs || [];

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("entityType");
    const role = searchParams.get("role");
    const status = searchParams.get("status");

    let filtered = auditLogs;
    if (entityType && entityType !== "all") {
      filtered = filtered.filter((l) => l.entity_type === entityType);
    }
    if (role && role !== "all") {
      filtered = filtered.filter((l) => l.actor_role === role);
    }
    if (status && status !== "all") {
      filtered = filtered.filter((l) => l.status === status);
    }

    return NextResponse.json({
      auditLogs: filtered,
      total: auditLogs.length,
    });
  } catch (error) {
    console.error("Failed to fetch audit trail:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load audit trail" },
      { status: 500 }
    );
  }
}
