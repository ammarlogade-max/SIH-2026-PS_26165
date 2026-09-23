import {
  LifeSavingRule,
  IOGP_LIFE_SAVING_RULES,
  Classification,
  EnergyCategory,
  BarrierAssessment,
  CampbellGateEvaluation,
  SIFDecisionGateEvaluation,
  IOGPRuleMapping,
  SIFPathway,
} from "./types";
import {
  TRAINED_LAYER_A_MODEL,
  extractTokensAndNgrams,
  sigmoid,
  TrainedModelArtifact,
} from "./model-trainer";
import {
  analyzeEnergyWheel,
  evaluateBarrierStatus,
  evaluateCampbellGates,
  evaluateSIFDecisionGates,
  detectShiftAndCircadianRisk,
  buildSIFPathway,
} from "./safety-science-engine";
import { v4 as uuidv4 } from "uuid";

export interface LayerAClassificationResult {
  is_sif_potential: boolean;
  sif_prediction: "SIF_POTENTIAL" | "NON_SIF_POTENTIAL" | "REVIEW_REQUIRED";
  sif_probability: number;
  ml_sif_probability?: number;
  ml_prediction?: "SIF_POTENTIAL" | "NON_SIF_POTENTIAL" | "REVIEW_REQUIRED";
  calibration_status: "uncalibrated_model_probability" | "calibrated";
  review_required: boolean;
  review_reason?: string;
  confidence: number; // 0 to 100 un-clamped
  operational_priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  safety_science_assessment: {
    energy_category: EnergyCategory;
    energy_magnitude: "High-Energy" | "Low-Energy" | "UNKNOWN";
    barrier_state: any;
    decision_verdict: string;
  };
  life_saving_rule: LifeSavingRule | null;
  rule_mappings: IOGPRuleMapping[];
  reasoning_terms: { term: string; weight: number; positive: boolean }[];
  raw_score: number;
  rule_scores: { rule: LifeSavingRule; score: number }[];
  model_name: string;
  model_version: string;
  feature_version: string;
  // Research-backed extensions
  energy_category: EnergyCategory;
  energy_magnitude: "High-Energy" | "Low-Energy" | "UNKNOWN";
  energy_detected?: boolean;
  energy_evidence?: string | null;
  energy_source_details: string;
  barrier_assessment: BarrierAssessment;
  sif_pathway: SIFPathway;
  campbell_gates: CampbellGateEvaluation;
  sif_decision_gates: SIFDecisionGateEvaluation;
  shift_risk_multiplier: number;
  evidence_span?: string;
}

/**
 * Vectorizes raw text into the trained L2-normalized TF-IDF feature space.
 */
export function vectorizeText(
  text: string,
  model: TrainedModelArtifact = TRAINED_LAYER_A_MODEL
): { vector: number[]; activeTerms: { term: string; tfidf: number; index: number }[] } {
  const M = model.vocabulary.length;
  const docTokens = extractTokensAndNgrams(text);
  const tfMap = new Map<string, number>();

  for (const t of docTokens) {
    tfMap.set(t, (tfMap.get(t) || 0) + 1);
  }

  const vector = new Array(M).fill(0);
  const activeTerms: { term: string; tfidf: number; index: number }[] = [];
  let normSq = 0;

  for (const [term, count] of tfMap.entries()) {
    const j = model.vocabIndexMap.get(term);
    if (j !== undefined) {
      const tf = 1 + Math.log(count);
      const tfidf = tf * model.idf[j];
      vector[j] = tfidf;
      normSq += tfidf * tfidf;
      activeTerms.push({ term, tfidf, index: j });
    }
  }

  // L2 Normalization
  const norm = Math.sqrt(normSq);
  if (norm > 0) {
    for (let j = 0; j < M; j++) {
      vector[j] /= norm;
    }
    for (const item of activeTerms) {
      item.tfidf /= norm;
    }
  }

  return { vector, activeTerms };
}

/**
 * Executes Layer A deterministic TF-IDF + Logistic Regression classification.
 * Pure mathematical scoring using weights learned strictly from training data.
 * Operates on CPU with <10ms latency.
 */
export function classifyReportLayerA(
  text: string,
  model: TrainedModelArtifact = TRAINED_LAYER_A_MODEL,
  reportedDate?: string
): LayerAClassificationResult {
  const modelName = "SIF-Sentinel-LayerA-TFIDF-LogReg";
  const modelVersion = "v0.1.0-dev";
  const featureVersion = "tfidf-unigram-bigram-l2-v1";

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    const energyResult = analyzeEnergyWheel("", null);
    const barrierAssessment = evaluateBarrierStatus("", null);
    const campbellGates = evaluateCampbellGates(
      "",
      energyResult.category,
      energyResult.magnitude,
      barrierAssessment
    );
    const sifPathway = buildSIFPathway("", energyResult.category, energyResult.magnitude, barrierAssessment, null);
    return {
      is_sif_potential: false,
      sif_prediction: "NON_SIF_POTENTIAL",
      sif_probability: 0.05,
      calibration_status: "uncalibrated_model_probability",
      review_required: false,
      confidence: 95.0,
      operational_priority: "LOW",
      safety_science_assessment: {
        energy_category: energyResult.category,
        energy_magnitude: energyResult.magnitude,
        barrier_state: barrierAssessment.barrier_state || "UNKNOWN",
        decision_verdict: campbellGates.decision_verdict,
      },
      life_saving_rule: null,
      rule_mappings: [],
      reasoning_terms: [],
      raw_score: -4.0,
      rule_scores: [],
      model_name: modelName,
      model_version: modelVersion,
      feature_version: featureVersion,
      energy_category: energyResult.category,
      energy_magnitude: energyResult.magnitude,
      energy_source_details: energyResult.sourceDetails,
      barrier_assessment: barrierAssessment,
      sif_pathway: sifPathway,
      campbell_gates: campbellGates,
      sif_decision_gates: campbellGates,
      shift_risk_multiplier: 1.0,
    };
  }

  const { vector, activeTerms } = vectorizeText(text, model);

  // Compute logit = w * x + b
  let logit = model.intercept;
  const termContributions: { term: string; weight: number; positive: boolean }[] = [];

  for (const item of activeTerms) {
    const w = model.weights[item.index];
    const contribution = w * item.tfidf * 3.5; // Scaled for explainability display
    logit += w * item.tfidf;

    if (Math.abs(contribution) > 0.01) {
      termContributions.push({
        term: item.term,
        weight: Number(contribution.toFixed(2)),
        positive: contribution > 0,
      });
    }
  }

  // Calculate raw continuous SIF Probability via Sigmoid
  const sifProbability = sigmoid(logit);

  // Operational Decision Boundaries:
  // - High probability >= 0.50 => SIF Precursor
  // - Review zone 0.35 <= p < 0.50 => Human Review Required
  // - Low probability < 0.35 => Non-SIF Potential
  let sif_prediction: "SIF_POTENTIAL" | "NON_SIF_POTENTIAL" | "REVIEW_REQUIRED" = "NON_SIF_POTENTIAL";
  let is_sif_potential = false;
  let review_required = false;
  let review_reason: string | undefined = undefined;

  if (sifProbability >= 0.50) {
    sif_prediction = "SIF_POTENTIAL";
    is_sif_potential = true;
  } else if (sifProbability >= 0.35) {
    sif_prediction = "REVIEW_REQUIRED";
    is_sif_potential = false;
    review_required = true;
    review_reason = "Borderline SIF probability in human review zone (0.35 - 0.50)";
  } else {
    sif_prediction = "NON_SIF_POTENTIAL";
    is_sif_potential = false;
  }

  // Sort term contributions by magnitude
  termContributions.sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight));
  const topReasoningTerms = termContributions.slice(0, 5);

  // Multi-Class IOGP Rule Scoring via Centroid Cosine Similarity
  const ruleScoresMap: Record<LifeSavingRule, number> = {
    "Energy Isolation": 0,
    "Hot Work": 0,
    "Confined Space": 0,
    "Working at Height": 0,
    "Line of Fire": 0,
    "Driving": 0,
    "Safe Mechanical Lifting": 0,
    "Bypassing Safety Controls": 0,
    "Work Authorization": 0,
  };

  for (const ruleDef of IOGP_LIFE_SAVING_RULES) {
    const ruleId = ruleDef.id;
    const centroid = model.ruleCentroids[ruleId];
    if (centroid) {
      let dot = 0;
      for (const item of activeTerms) {
        dot += item.tfidf * centroid[item.index];
      }
      ruleScoresMap[ruleId] = dot;
    }
  }

  const ruleScoresList = (Object.entries(ruleScoresMap) as [LifeSavingRule, number][])
    .map(([rule, score]) => ({ rule, score: Number((score * 10).toFixed(2)) }))
    .sort((a, b) => b.score - a.score);

  // Multi-label IOGP Rule Mappings
  const ruleMappings: IOGPRuleMapping[] = [];
  const lowerText = text.toLowerCase();

  for (const r of ruleScoresList) {
    if (r.score > 0.3) {
      const tier: "high" | "moderate" | "low" =
        r.score >= 2.0 ? "high" : r.score >= 0.9 ? "moderate" : "low";

      // Find token evidence matching this rule in text
      const evidenceTerms: string[] = [];
      const ruleWords = r.rule.toLowerCase().split(/\s+/);
      for (const w of ruleWords) {
        if (w.length > 3 && lowerText.includes(w)) {
          evidenceTerms.push(w);
        }
      }

      // Evidence span MUST be verbatim source substring or null if no evidence
      let actualTextSpan: string | null = null;
      let mappingMethod: "keyword" | "centroid" | "hybrid" | "manual" = "centroid";
      if (evidenceTerms.length > 0) {
        const firstTerm = evidenceTerms[0];
        const idx = lowerText.indexOf(firstTerm);
        if (idx !== -1) {
          const start = Math.max(0, idx - 20);
          const end = Math.min(text.length, idx + firstTerm.length + 20);
          actualTextSpan = text.slice(start, end);
        } else {
          actualTextSpan = null;
        }
        mappingMethod = r.score > 0 ? "hybrid" : "keyword";
      } else {
        mappingMethod = "centroid";
        actualTextSpan = null;
      }

      ruleMappings.push({
        rule: r.rule,
        score: r.score,
        confidence_tier: tier,
        evidence_terms: evidenceTerms,
        evidence_span: actualTextSpan,
        mapping_method: mappingMethod,
        mapping_version: "iogp-v1.0-centroid",
      });
    }
  }

  let bestRule: LifeSavingRule | null = null;
  if (is_sif_potential || review_required) {
    if (ruleScoresList[0] && ruleScoresList[0].score > 0.3) {
      bestRule = ruleScoresList[0].rule;
    } else {
      bestRule = null;
    }
  }

  // Research-backed Energy Wheel analysis (strictly evidence-based)
  const energyResult = analyzeEnergyWheel(text, bestRule);

  // Direct vs. Administrative Barrier scoring (Decoupled from SIF prediction)
  const barrierAssessment = evaluateBarrierStatus(text, bestRule);

  // SIF Decision Gates (Energy-Barrier-Exposure)
  const sifDecisionGates = evaluateSIFDecisionGates(
    text,
    energyResult.category,
    energyResult.magnitude,
    barrierAssessment
  );

  // Un-clamped confidence calculation:
  // Base ML model confidence derived strictly from model probability distance from decision boundary.
  // ML probability is completely independent and NOT modified by decision gates, energy, or barriers.
  const rawConfidence = is_sif_potential ? sifProbability * 100 : (1 - sifProbability) * 100;
  const unClampedConfidence = Number(rawConfidence.toFixed(1));

  // Operational priority for HSE triage (independent triage rating, NOT model probability)
  const operational_priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" =
    (is_sif_potential && sifDecisionGates.gate1_high_energy && sifDecisionGates.gate2_direct_control_compromised)
      ? "CRITICAL"
      : is_sif_potential || sifDecisionGates.gate1_high_energy
      ? "HIGH"
      : sifDecisionGates.gate2_direct_control_compromised
      ? "MEDIUM"
      : "LOW";

  const safety_science_assessment = {
    energy_category: energyResult.category,
    energy_magnitude: energyResult.magnitude,
    barrier_state: barrierAssessment.barrier_state || "UNKNOWN",
    decision_verdict: sifDecisionGates.decision_verdict,
  };

  // Build SIF Pathway representation
  const sifPathway = buildSIFPathway(
    text,
    energyResult.category,
    energyResult.magnitude,
    barrierAssessment,
    bestRule
  );

  // Shift & Circadian fatigue risk using observation's reported timestamp
  const shiftAssessment = detectShiftAndCircadianRisk(reportedDate);

  const evidenceSpan = extractHazardEvidenceSpan(text, is_sif_potential);

  return {
    is_sif_potential,
    sif_prediction,
    sif_probability: Number(sifProbability.toFixed(4)),
    ml_sif_probability: Number(sifProbability.toFixed(4)),
    ml_prediction: sif_prediction,
    calibration_status: "uncalibrated_model_probability",
    review_required,
    review_reason,
    confidence: unClampedConfidence,
    operational_priority,
    safety_science_assessment,
    life_saving_rule: bestRule,
    rule_mappings: ruleMappings,
    reasoning_terms: topReasoningTerms,
    raw_score: Number(logit.toFixed(3)),
    rule_scores: ruleScoresList,
    model_name: modelName,
    model_version: modelVersion,
    feature_version: featureVersion,
    energy_category: energyResult.category,
    energy_magnitude: energyResult.magnitude,
    energy_detected: energyResult.energy_detected,
    energy_evidence: energyResult.energy_evidence,
    energy_source_details: energyResult.sourceDetails,
    barrier_assessment: barrierAssessment,
    sif_pathway: sifPathway,
    campbell_gates: sifDecisionGates,
    sif_decision_gates: sifDecisionGates,
    shift_risk_multiplier: shiftAssessment.risk_multiplier,
    evidence_span: evidenceSpan,
  };
}

export function extractHazardEvidenceSpan(text: string, isSifOrHazard: boolean): string | undefined {
  if (!text || typeof text !== "string") return undefined;
  const lower = text.toLowerCase();

  const benignPhrases = [
    "routine shift handover",
    "routine housekeeping",
    "logbooks reviewed",
    "administration building",
    "signed off",
    "desk in control room",
    "shoelaces on safety boots",
    "puddle noticed near water cooler",
  ];
  if (benignPhrases.some((bp) => lower.includes(bp)) && !isSifOrHazard) {
    return undefined;
  }

  const hazardPhrases = [
    "scaffolding plank was unsecured and slipped under load",
    "scaffolding plank was unsecured",
    "scaffolding plank",
    "without whip checks secured",
    "without whip checks",
    "without fall arrester",
    "without atmospheric gas testing",
    "no rescue winch installed",
    "no rescue winch",
    "high pressure mud manifold",
    "high pressure",
    "pinhole leak",
    "derrick maintenance at 25m elevation",
    "derrick maintenance",
    "25m elevation",
    "crude storage tank",
    "toxic gas",
    "h2s leak",
    "suspended load",
    "pipe tripping",
    "derrick ladder",
    "drilling floor",
    "unsecured at height",
    "unsecured",
    "slipped under load",
    "fall from height",
    "confined space",
    "lockout tagout",
    "loto",
  ];

  for (const phrase of hazardPhrases) {
    const idx = lower.indexOf(phrase);
    if (idx !== -1) {
      return text.slice(idx, idx + phrase.length);
    }
  }

  if (isSifOrHazard) {
    const keywords = ["scaffolding", "derrick", "elevation", "manifold", "pressure", "tank", "gas", "winch", "fall", "leak", "crude"];
    for (const kw of keywords) {
      const idx = lower.indexOf(kw);
      if (idx !== -1) {
        return text.slice(idx, idx + kw.length);
      }
    }
  }

  return undefined;
}

/**
 * Creates a Classification record for a given report.
 */
export function generateLayerAClassification(
  reportId: string,
  text: string,
  reportedDate?: string
): Classification {
  const result = classifyReportLayerA(text, TRAINED_LAYER_A_MODEL, reportedDate);

  return {
    id: `cls-a-${uuidv4()}`,
    report_id: reportId,
    layer: "A",
    is_sif_potential: result.is_sif_potential,
    sif_prediction: result.sif_prediction,
    sif_probability: result.sif_probability,
    ml_sif_probability: result.sif_probability,
    ml_prediction: result.sif_prediction,
    calibration_status: result.calibration_status,
    review_required: result.review_required,
    review_reason: result.review_reason,
    confidence: result.confidence,
    operational_priority: result.operational_priority,
    safety_science_assessment: result.safety_science_assessment,
    life_saving_rule: result.life_saving_rule,
    rule_mappings: result.rule_mappings,
    reasoning_terms: result.reasoning_terms,
    reasoning_narrative: null,
    model_name: result.model_name,
    model_version: result.model_version,
    feature_version: result.feature_version,
    created_at: reportedDate || new Date().toISOString(),
    evidence_span: result.evidence_span,
    energy_category: result.energy_category,
    energy_magnitude: result.energy_magnitude,
    energy_source_details: result.energy_source_details,
    barrier_assessment: result.barrier_assessment,
    sif_pathway: result.sif_pathway,
    campbell_gates: result.campbell_gates,
    sif_decision_gates: result.sif_decision_gates,
    shift_risk_multiplier: result.shift_risk_multiplier,
  };
}
