import { groq, GROQ_FAST_MODEL, hasConfiguredAIProvider } from "./groq";
import { LifeSavingRule, WeeklyHseDigest } from "./types";
import { AggregationResult } from "./aggregation-engine";
import { v4 as uuidv4 } from "uuid";

/**
 * Turns a trained model's raw term weights and classification into a fluent
 * explanatory sentence. The decision and rule are strictly fixed by the classifier.
 */
export async function generateReasoningNarrative(params: {
  text: string;
  isSif: boolean;
  rule: LifeSavingRule | null;
  terms: { term: string; weight: number; positive: boolean }[];
}): Promise<string> {
  const { text, isSif, rule, terms } = params;

  // If non-SIF
  if (!isSif) {
    const matchedNonSif = terms.filter((t) => !t.positive).map((t) => t.term).join(", ");
    if (matchedNonSif) {
      return `Classified as non-SIF potential: observation represents low-consequence housekeeping or facility maintenance (${matchedNonSif}) with zero fatal precursor mechanisms detected.`;
    }
    return "Classified as non-SIF potential: no critical energy release, height, toxic exposure, or fatal precursor mechanisms detected in the observation.";
  }

  // If SIF
  const topPositiveTerms = terms.filter((t) => t.positive).map((t) => `"${t.term}" (+${t.weight})`).join(", ");
  const fallbackNarrative = `Classified as SIF-potential precursor under IOGP Life-Saving Rule '${rule}': driven by key risk indicators [${topPositiveTerms || "hazardous condition"}] presenting high fatal consequence probability if barrier fails.`;

  // Try optional Groq phrasing if available
  if (hasConfiguredAIProvider) try {
    const prompt = `You are an HSE Safety Officer. Convert these real model classification weights into a concise 1-2 sentence professional explanation. Do NOT change the verdict or rule.

Report text: "${text.slice(0, 300)}"
Verdict: SIF-Potential Precursor
Assigned IOGP Rule: ${rule}
Top Model Contributing Features: ${topPositiveTerms}

Write 1-2 factual sentences explaining why this observation is a SIF precursor based on the rule and features above. Return ONLY the sentence.`;

    const res = await groq.chat.completions.create({
      model: GROQ_FAST_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 150,
    });

    const output = res.choices[0]?.message?.content?.trim();
    if (output && output.length > 20) {
      return output;
    }
  } catch {
    // Fall back gracefully to deterministic explanation
  }

  return fallbackNarrative;
}

/**
 * Generates the Weekly HSE Executive Digest based on real computed precursor densities.
 */
export async function generateWeeklyHseDigest(aggregates: AggregationResult): Promise<WeeklyHseDigest> {
  const periodStart = new Date(Date.now() - 86400000 * 7).toISOString().split("T")[0];
  const periodEnd = new Date().toISOString().split("T")[0];

  const topSites = aggregates.siteAggregates.slice(0, 3).map((s) => ({
    site: s.site,
    sif_count: s.sif_reports,
    density: s.precursor_density,
    primary_rule: s.primary_rule || ("Work Authorization" as LifeSavingRule),
  }));

  const suggestedInterventions = aggregates.siteAggregates.slice(0, 3).map((s) => ({
    rule: s.primary_rule || ("Work Authorization" as LifeSavingRule),
    site: s.site,
    action: `Conduct dedicated supervisory stand-down and barrier verification audit on ${s.primary_rule || "critical controls"} across ${s.activity}.`,
    priority: s.precursor_density > 35 ? ("immediate" as const) : s.precursor_density > 20 ? ("high" as const) : ("scheduled" as const),
  }));

  // Build deterministic executive summary
  let execSummary = `During this reporting period, ${aggregates.totalReports} total safety observations were analyzed across Oil India operations. ${aggregates.sifReportsCount} reports (${aggregates.overallPrecursorDensity}%) were identified as genuine SIF-potential precursors.`;
  
  if (aggregates.topRiskSite) {
    execSummary += ` ${aggregates.topRiskSite} exhibits the highest precursor concentration with a ${aggregates.highestRiskDensity}% SIF density.`;
  }
  if (aggregates.patternCallouts.length > 0) {
    execSummary += ` ${aggregates.patternCallouts.length} active recurring precursor clusters require urgent HSE leadership intervention.`;
  }

  // Try optional Groq narration if available
  if (aggregates.totalReports > 0 && hasConfiguredAIProvider) {
    try {
      const statsSummary = `Total Reports: ${aggregates.totalReports}, SIF Precursors: ${aggregates.sifReportsCount} (${aggregates.overallPrecursorDensity}%), Top Site: ${aggregates.topRiskSite} (${aggregates.highestRiskDensity}%), Active Patterns: ${aggregates.patternCallouts.length}. Top Rules: ${aggregates.ruleDistribution.slice(0, 3).map((r) => `${r.rule} (${r.count})`).join(", ")}.`;
      
      const prompt = `Write a concise, professional 3-sentence executive HSE summary for Oil India leadership based on these exact statistics:
${statsSummary}

Do not invent numbers. Be clear, urgent, and focused on fatal risk prevention. Return ONLY the 3-sentence summary.`;

      const res = await groq.chat.completions.create({
        model: GROQ_FAST_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 200,
      });

      const narrated = res.choices[0]?.message?.content?.trim();
      if (narrated && narrated.length > 50) {
        execSummary = narrated;
      }
    } catch {
      // Use deterministic summary
    }
  }

  return {
    id: `digest-${uuidv4().slice(0, 8)}`,
    period_start: periodStart,
    period_end: periodEnd,
    total_reports: aggregates.totalReports,
    total_sif_precursors: aggregates.sifReportsCount,
    overall_precursor_density: aggregates.overallPrecursorDensity,
    top_risk_sites: topSites,
    active_patterns_count: aggregates.patternCallouts.length,
    executive_summary: execSummary,
    suggested_interventions: suggestedInterventions,
    generated_at: new Date().toISOString(),
  };
}
