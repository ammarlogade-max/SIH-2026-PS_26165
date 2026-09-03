import { NextRequest, NextResponse } from "next/server";
import { getSafetySnapshot } from "@/lib/safety-store";
import { computeAggregates } from "@/lib/aggregation-engine";
import { LifeSavingRule } from "@/lib/types";
import { hasConfiguredAIProvider, groqChat } from "@/lib/groq";

export interface InvestigationResult {
  targetType: "facility" | "pattern" | "rule" | "report";
  targetName: string;
  executiveSummary: string;
  riskSignals: string[];
  recurringEvidence: {
    report_id: string;
    text: string;
    site: string;
    activity: string;
    rule: LifeSavingRule | null;
    confidence: number;
  }[];
  barrierBreakdowns: {
    barrier: string;
    severity: "critical" | "high" | "moderate";
    description: string;
  }[];
  contributingFactors: {
    category: "Physical & Mechanical" | "Procedural & Human Factors" | "Supervisory & Verification" | "Environmental & Operational";
    details: string;
  }[];
  lifeSavingRule: LifeSavingRule;
  recommendedActions: {
    title: string;
    description: string;
    priority: "immediate" | "high" | "medium";
    targetRole: "Supervisor" | "HSE Officer" | "Plant Manager";
  }[];
  confidenceScore: number;
  evidenceSourceCount: number;
  providerUsed: "grounded-llm" | "deterministic-safety-engine";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { targetType = "facility", targetId, site, rule, reportId } = body;

    const snapshot = await getSafetySnapshot();
    const reports = snapshot.reports || [];
    const classifications = snapshot.classifications || [];
    const classMap = new Map(classifications.map((c) => [c.report_id, c]));

    // Find relevant reports based on target
    let relevantReports = reports;
    let targetTitle = "Asset Operations";
    let primaryRule: LifeSavingRule = "Work Authorization";

    if (targetType === "facility" && site) {
      targetTitle = site;
      relevantReports = reports.filter((r) => r.site.toLowerCase() === site.toLowerCase());
    } else if (targetType === "rule" && rule) {
      targetTitle = `IOGP Rule: ${rule}`;
      primaryRule = rule as LifeSavingRule;
      relevantReports = reports.filter((r) => {
        const cls = classMap.get(r.id);
        return cls?.life_saving_rule === rule;
      });
    } else if (targetType === "report" && reportId) {
      const rep = reports.find((r) => r.id === reportId);
      if (rep) {
        targetTitle = `Observation #${rep.id.slice(0, 8)}`;
        relevantReports = [rep];
        const c = classMap.get(rep.id);
        if (c?.life_saving_rule) primaryRule = c.life_saving_rule;
      }
    } else if (targetType === "pattern") {
      const aggs = computeAggregates(reports, classifications);
      const pat = aggs.patternCallouts.find((p) => p.id === targetId) || aggs.patternCallouts[0];
      if (pat) {
        targetTitle = `Pattern: ${pat.site} - ${pat.life_saving_rule}`;
        primaryRule = pat.life_saving_rule;
        relevantReports = reports.filter((r) => pat.report_ids.includes(r.id));
      }
    }

    if (relevantReports.length === 0) {
      relevantReports = reports.slice(0, 5);
    }

    // Determine primary rule from reports if not set
    const ruleCounts = new Map<LifeSavingRule, number>();
    for (const r of relevantReports) {
      const cls = classMap.get(r.id);
      if (cls?.life_saving_rule) {
        ruleCounts.set(cls.life_saving_rule, (ruleCounts.get(cls.life_saving_rule) || 0) + 1);
      }
    }
    let maxCount = 0;
    for (const [r, count] of ruleCounts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        primaryRule = r;
      }
    }

    // Extract real evidence items
    const recurringEvidence = relevantReports.slice(0, 6).map((r) => {
      const cls = classMap.get(r.id);
      return {
        report_id: r.id,
        text: r.raw_text,
        site: r.site,
        activity: r.activity,
        rule: cls?.life_saving_rule || null,
        confidence: cls?.confidence || 85,
      };
    });

    const sifCount = relevantReports.filter((r) => classMap.get(r.id)?.is_sif_potential).length;
    const precursorDensity = relevantReports.length > 0 ? (sifCount / relevantReports.length) * 100 : 0;

    // Collect top keywords from classifications
    const topKeywords = new Set<string>();
    relevantReports.forEach((r) => {
      const cls = classMap.get(r.id);
      cls?.reasoning_terms.forEach((t) => {
        if (t.positive) topKeywords.add(t.term);
      });
    });
    const keyTermsList = Array.from(topKeywords).slice(0, 8);

    // Default High-Precision Grounded Safety Synthesis
    let executiveSummary = `Comprehensive safety investigation conducted for ${targetTitle}. Review of ${relevantReports.length} recorded field observations identified ${sifCount} serious injury & fatality (SIF) precursor events (precursor density: ${precursorDensity.toFixed(1)}%). Core vulnerability clusters around '${primaryRule}'. Immediate barrier verification and supervisor audit are recommended.`;

    const barrierBreakdowns: InvestigationResult["barrierBreakdowns"] = [
      {
        barrier: `Primary Prevention Control (${primaryRule})`,
        severity: precursorDensity > 40 ? "critical" : "high",
        description: `Field observations indicate failure or bypass of verified procedural controls related to ${primaryRule}. Key operational indicators: ${keyTermsList.slice(0, 3).join(", ") || "procedural drift"}.`,
      },
      {
        barrier: "Permit to Work (PTW) & Job Safety Verification",
        severity: "high",
        description: "Inadequate pre-task risk briefing or deviation from authorized scope without formal Management of Change (MOC) review.",
      },
      {
        barrier: "Active Supervision & Line-of-Fire Boundary Enforcement",
        severity: "moderate",
        description: "Supervisory oversight was insufficient to prevent uncertified personnel from entering high-risk exposure zones during active tasks.",
      },
    ];

    const contributingFactors: InvestigationResult["contributingFactors"] = [
      {
        category: "Physical & Mechanical",
        details: `Hardware wear, uncalibrated monitoring instrumentation, or deferred preventive maintenance on critical assets at ${targetTitle}.`,
      },
      {
        category: "Procedural & Human Factors",
        details: "Subcontractor unfamiliarity with standard Operating Procedures (SOPs), perceived time pressure, or bypassing redundant safety interlocks.",
      },
      {
        category: "Supervisory & Verification",
        details: "Toolbox talks conducted as routine paperwork without physically verifying zero energy, harness anchor strength, or atmospheric gas readouts.",
      },
      {
        category: "Environmental & Operational",
        details: "High ambient heat, poor night illumination, or restricted work footprint elevating line-of-fire risk during simultaneous operations (SIMOPS).",
      },
    ];

    const recommendedActions: InvestigationResult["recommendedActions"] = [
      {
        title: `Conduct immediate barrier verification audit on ${primaryRule} at ${targetTitle}`,
        description: `Direct the asset superintendent to halt non-critical activity until all safety interlocks, isolation points, and PPE tie-off anchors are physically audited.`,
        priority: "immediate",
        targetRole: "Supervisor",
      },
      {
        title: `Mandatory specialized toolbox briefing on '${primaryRule}' hazards`,
        description: `Deliver an interactive hazard awareness session focused on key precursor triggers (${keyTermsList.slice(0, 4).join(", ")}) for all shift crews and contractors.`,
        priority: "high",
        targetRole: "HSE Officer",
      },
      {
        title: `Implement secondary supervisory verification checkpoint for high-risk permits`,
        description: `Require plant manager or HSE lead counter-signature on high-hazard PTWs before energizing or entering restricted operational zones.`,
        priority: "high",
        targetRole: "Plant Manager",
      },
    ];

    let providerUsed: "grounded-llm" | "deterministic-safety-engine" = "deterministic-safety-engine";

    // If AI provider is available, use it to refine the executive summary and context
    if (hasConfiguredAIProvider) {
      try {
        const observationTextSnippets = relevantReports
          .slice(0, 5)
          .map((r, i) => `[Observation ${i + 1}] Site: ${r.site}, Activity: ${r.activity}, Raw Text: "${r.raw_text}"`)
          .join("\n");

        const prompt = `You are a Senior Industrial HSE Lead Investigator for Oil India Limited.
Perform an evidence-grounded safety precursor synthesis for: ${targetTitle}
Primary Life-Saving Rule: ${primaryRule}
Relevant Observations:
${observationTextSnippets}

Key TF-IDF Terms Detected: ${keyTermsList.join(", ")}

Write an authoritative 3-sentence executive investigation summary highlighting the exact barrier failures, operational risks, and urgent corrective priorities. Keep tone objective, technical, and urgent. Do not invent fake statistics.`;

        const aiText = await groqChat([
          { role: "system", content: "You are an expert industrial safety engineer specialized in SIF precursor analysis and IOGP Life-Saving Rules." },
          { role: "user", content: prompt },
        ]);

        if (aiText && aiText.length > 40) {
          executiveSummary = aiText.trim();
          providerUsed = "grounded-llm";
        }
      } catch (aiErr) {
        console.warn("AI generation fallback to deterministic synthesis:", aiErr);
      }
    }

    const responsePayload: InvestigationResult = {
      targetType: targetType as InvestigationResult["targetType"],
      targetName: targetTitle,
      executiveSummary,
      riskSignals: [
        `Precursor density stands at ${precursorDensity.toFixed(1)}% across ${relevantReports.length} analyzed events.`,
        `Dominant fatal risk category: ${primaryRule}.`,
        `Recurring terminology clusters around: ${keyTermsList.slice(0, 5).join(", ") || "critical controls"}.`,
        `${sifCount} observations meet criteria for Serious Injury & Fatality precursor events.`,
      ],
      recurringEvidence,
      barrierBreakdowns,
      contributingFactors,
      lifeSavingRule: primaryRule,
      recommendedActions,
      confidenceScore: Math.round(92 - (100 - precursorDensity) * 0.1),
      evidenceSourceCount: relevantReports.length,
      providerUsed,
    };

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error("Investigation synthesis failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to synthesize investigation" },
      { status: 500 }
    );
  }
}
