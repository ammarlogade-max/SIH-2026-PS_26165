import { NextResponse } from "next/server";
import { computeAggregates } from "@/lib/aggregation-engine";
import { groq, hasConfiguredAIProvider } from "@/lib/groq";
import { getSafetySnapshot } from "@/lib/safety-store";

export const runtime = "nodejs";

type ChatMessage = { role: "user" | "assistant"; content: string };

function deterministicAssistantReply(question: string, aggregates: ReturnType<typeof computeAggregates>) {
  const lower = question.toLowerCase();
  const dataStatus = aggregates.totalReports
    ? `The current workspace contains ${aggregates.totalReports} processed report${aggregates.totalReports === 1 ? "" : "s"}, with ${aggregates.sifReportsCount} SIF precursor${aggregates.sifReportsCount === 1 ? "" : "s"} and an overall precursor density of ${aggregates.overallPrecursorDensity}%.`
    : "No safety observations have been ingested in the current workspace, so the system cannot infer an active risk priority yet.";

  if (lower.includes("classif") || lower.includes("near-miss") || lower.includes("observation")) {
    return `${dataStatus}\n\nTo classify a near-miss, open Report Ingestion, enter the observation, facility, activity and date, then submit it. Layer A evaluates SIF potential, confidence, an IOGP Life-Saving Rule and the contributing terms used in the decision.`;
  }
  if (lower.includes("density") || lower.includes("facility") || lower.includes("ranking")) {
    return `${dataStatus}\n\nPrecursor density is calculated as SIF precursor reports divided by total reports for a facility or activity. Use Facility Density to compare the actual ranked locations; treat low-report samples cautiously and investigate the underlying observations before operational decisions.`;
  }
  if (lower.includes("pattern") || lower.includes("repeat") || lower.includes("recurring")) {
    return `${dataStatus}\n\nPattern Intelligence groups repeated SIF-potential observations with the same facility and IOGP rule. A detected cluster should trigger a focused barrier verification, supervisor review and follow-up in the Safety Reports queue.`;
  }
  if (lower.includes("rule") || lower.includes("iogp") || lower.includes("life-saving")) {
    return "SIF Sentinel maps classified observations to the nine IOGP Life-Saving Rules, including Energy Isolation, Working at Height, Hot Work, Confined Space and Line of Fire. The rule mapping gives the HSE team a specific control area to verify rather than a generic risk label.";
  }
  if (lower.includes("explain") || lower.includes("why") || lower.includes("decision")) {
    return `${dataStatus}\n\nOpen a classified report or the Explainable AI panel to review the model confidence, mapped IOGP rule and TF-IDF contributing terms. Those terms explain the classifier signal; they do not replace site verification or an HSE professional's judgment.`;
  }
  if (lower.includes("action") || lower.includes("hse") || lower.includes("priority")) {
    const topSite = aggregates.topRiskSite ? ` The highest-ranked facility is ${aggregates.topRiskSite} at ${aggregates.highestRiskDensity}% density.` : "";
    return `${dataStatus}${topSite}\n\nStart with critical precursor reports, verify the relevant Life-Saving Rule barriers, investigate recurring site-and-rule clusters, and document corrective action through the report triage workflow.`;
  }
  return `${dataStatus}\n\nSIF Sentinel supports report ingestion, SIF precursor classification, IOGP rule mapping, facility density, recurring-pattern detection, explainable AI and HSE digests. Ask about any of those workflows for focused guidance.`;
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const input = body && typeof body === "object" ? body as Record<string, unknown> : {};
    const message = typeof input.message === "string" ? input.message.trim() : "";

    if (!message) {
      return NextResponse.json({ error: "A question is required." }, { status: 400 });
    }
    if (message.length > 2000) {
      return NextResponse.json({ error: "Questions must not exceed 2,000 characters." }, { status: 400 });
    }

    const history: ChatMessage[] = Array.isArray(input.history)
      ? input.history
        .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
        .filter((item) => typeof item.content === "string" && (item.role === "user" || item.role === "assistant"))
        .slice(-6)
        .map((item) => ({ role: item.role as ChatMessage["role"], content: (item.content as string).slice(0, 2000) }))
      : [];

    const snapshot = await getSafetySnapshot();
    const aggregates = computeAggregates(snapshot.reports, snapshot.classifications);
    const fallbackReply = deterministicAssistantReply(message, aggregates);

    if (!hasConfiguredAIProvider) {
      return NextResponse.json({ reply: fallbackReply, mode: "deterministic", storage: snapshot.storage });
    }

    const systemPrompt = `You are the AI Safety Assistant for Oil India Limited's SIF Sentinel platform. Give concise, safety-focused operational guidance. Never invent reports, counts, facilities or model performance.\n\nCurrent data snapshot: total reports ${aggregates.totalReports}; SIF precursors ${aggregates.sifReportsCount}; precursor density ${aggregates.overallPrecursorDensity}%; top facility ${aggregates.topRiskSite || "not available"}; active recurring patterns ${aggregates.patternCallouts.length}.\n\nThe platform classifies SIF precursors, maps IOGP Life-Saving Rules, ranks facility density, detects recurring patterns and shows model term explanations.`;

    try {
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          ...history,
          { role: "user", content: message },
        ],
        temperature: 0.25,
        max_tokens: 500,
      });
      const reply = completion.choices[0]?.message?.content?.trim();
      if (reply) return NextResponse.json({ reply, mode: "ai", storage: snapshot.storage });
    } catch (error) {
      console.warn("Configured AI provider failed; returning deterministic SIF guidance.", error);
    }

    return NextResponse.json({ reply: fallbackReply, mode: "deterministic", storage: snapshot.storage });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Assistant request could not be processed.";
    console.error("Assistant API error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
