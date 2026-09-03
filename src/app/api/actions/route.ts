import { NextRequest, NextResponse } from "next/server";
import { getSafetySnapshot, saveCorrectiveAction } from "@/lib/safety-store";
import { CorrectiveAction, UserRole, LifeSavingRule } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: NextRequest) {
  try {
    const snapshot = await getSafetySnapshot();
    const actions = snapshot.actions || [];

    const { searchParams } = new URL(request.url);
    const site = searchParams.get("site");
    const status = searchParams.get("status");
    const rule = searchParams.get("rule");
    const priority = searchParams.get("priority");

    let filtered = actions;
    if (site && site !== "all") {
      filtered = filtered.filter((a) => a.site.toLowerCase() === site.toLowerCase());
    }
    if (status && status !== "all") {
      filtered = filtered.filter((a) => a.status === status);
    }
    if (rule && rule !== "all") {
      filtered = filtered.filter((a) => a.life_saving_rule === rule);
    }
    if (priority && priority !== "all") {
      filtered = filtered.filter((a) => a.priority === priority);
    }

    return NextResponse.json({
      actions: filtered,
      total: actions.length,
      counts: {
        open: actions.filter((a) => a.status === "open").length,
        in_progress: actions.filter((a) => a.status === "in_progress").length,
        overdue: actions.filter((a) => a.status === "overdue").length,
        completed: actions.filter((a) => a.status === "completed").length,
        verified: actions.filter((a) => a.status === "verified").length,
      },
    });
  } catch (error) {
    console.error("Failed to load corrective actions:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load corrective actions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      site,
      life_saving_rule,
      assigned_to,
      assigned_role = "Supervisor",
      priority = "high",
      due_date,
      report_id,
      pattern_id,
      actor_name = "Safety Lead",
      actor_role = "HSE Officer",
    } = body;

    if (!title || !site || !life_saving_rule || !assigned_to || !due_date) {
      return NextResponse.json(
        { error: "Title, site, Life-Saving Rule, assignee, and due date are required." },
        { status: 400 }
      );
    }

    const newAction: CorrectiveAction = {
      id: `act-${uuidv4().slice(0, 8)}`,
      report_id,
      pattern_id,
      site,
      life_saving_rule: life_saving_rule as LifeSavingRule,
      title,
      description: description || "",
      assigned_to,
      assigned_role: assigned_role as UserRole,
      priority,
      status: "open",
      due_date,
      created_at: new Date().toISOString(),
    };

    const saved = await saveCorrectiveAction(newAction, {
      name: actor_name,
      role: actor_role as UserRole,
    });

    return NextResponse.json({ action: saved }, { status: 201 });
  } catch (error) {
    console.error("Failed to create corrective action:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create corrective action" },
      { status: 500 }
    );
  }
}
